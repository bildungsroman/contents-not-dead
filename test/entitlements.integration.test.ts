import { createClerkClient } from "@clerk/nextjs/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getStripe } from "@/lib/stripe";
import { getClerkKeys } from "@/lib/clerk-keys";
import {
  cancelRedundantFreeSubscriptions,
  ensureFreeSubscription,
  fetchEntitlements,
  fetchSubscriptionFromStripe,
  getOrCreateStripeCustomer,
  hasActivePaidSubscription,
  isActive,
  isPaidPlan,
  writeSubscriptionState,
} from "@/lib/subscription";
import { TIER_FEATURE } from "@/lib/tiers";

/**
 * Drives the real sign-in -> free tier -> upgrade path against live Stripe and
 * Clerk test instances. Creates and deletes real objects, so it is opt-in:
 *
 *   RUN_INTEGRATION=1 node --env-file=.env ./node_modules/.bin/vitest run test/
 */
const enabled = process.env.RUN_INTEGRATION === "1";

/** Entitlements are computed asynchronously; wait rather than assert too early. */
async function waitForEntitlements(customerId: string, want: number) {
  for (let i = 0; i < 15; i++) {
    const keys = await fetchEntitlements(customerId);
    if (keys.size >= want) return keys;
    await new Promise((r) => setTimeout(r, 800));
  }
  return fetchEntitlements(customerId);
}

describe.skipIf(!enabled)("free tier provisioning (integration)", () => {
  const clerk = createClerkClient({ secretKey: getClerkKeys().secretKey! });
  let userId: string;
  let customerId: string;

  beforeAll(async () => {
    const user = await clerk.users.createUser({
      emailAddress: [`cnd-verify-${Date.now()}+clerk_test@example.com`],
      skipPasswordRequirement: true,
    });
    userId = user.id;
  }, 60_000);

  afterAll(async () => {
    if (customerId) await getStripe().customers.del(customerId);
    if (userId) await clerk.users.deleteUser(userId);
  }, 60_000);

  it(
    "gives a brand new user the free entitlement and nothing more",
    async () => {
      customerId = await getOrCreateStripeCustomer(userId);
      const created = await ensureFreeSubscription(customerId);
      expect(created).toBe(true);

      const entitlements = await waitForEntitlements(customerId, 1);
      const derived = (await fetchSubscriptionFromStripe(customerId))!;
      await writeSubscriptionState(userId, customerId, derived, entitlements);

      expect(derived.plan).toBe("free");
      expect(isActive(derived)).toBe(true);
      // A $0 subscription is active but must never read as a purchase.
      expect(isPaidPlan(derived.plan)).toBe(false);
      // ...so checkout must still be open to them.
      expect(hasActivePaidSubscription(derived)).toBe(false);

      // The gate every call site runs.
      expect(entitlements.has(TIER_FEATURE.free)).toBe(true);
      expect(entitlements.has(TIER_FEATURE.paid)).toBe(false);

      // And it survives the round trip through Clerk's metadata cache.
      const user = await clerk.users.getUser(userId);
      const meta = user.publicMetadata as Record<string, any>;
      expect(meta.stripeCustomerId).toBe(customerId);
      expect(meta.entitlements.keys).toEqual([TIER_FEATURE.free]);
      expect(meta.subscription.plan).toBe("free");
    },
    120_000,
  );

  it(
    "is idempotent — a second sign-in does not create another subscription",
    async () => {
      expect(await ensureFreeSubscription(customerId)).toBe(false);
      const subs = await getStripe().subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 20,
      });
      expect(subs.data.length).toBe(1);
    },
    60_000,
  );

  it(
    "upgrades to paid, grants both tiers, and drops the redundant free sub",
    async () => {
      const stripe = getStripe();
      const pm = await stripe.paymentMethods.create({
        type: "card",
        card: { token: "tok_visa" },
      });
      await stripe.paymentMethods.attach(pm.id, { customer: customerId });
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: pm.id },
      });
      await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: process.env.STRIPE_PRICE_MONTHLY! }],
      });

      const entitlements = await waitForEntitlements(customerId, 2);
      expect(entitlements.has(TIER_FEATURE.free)).toBe(true);
      expect(entitlements.has(TIER_FEATURE.paid)).toBe(true);

      // What the webhook does on upgrade.
      await cancelRedundantFreeSubscriptions(customerId);
      const live = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 20,
      });
      expect(live.data.length).toBe(1);
      expect(live.data[0].items.data[0].price.id).toBe(
        process.env.STRIPE_PRICE_MONTHLY,
      );

      const derived = (await fetchSubscriptionFromStripe(customerId))!;
      expect(derived.plan).toBe("monthly");
      expect(isPaidPlan(derived.plan)).toBe(true);
      // And checkout now refuses to open a second, duplicate subscription.
      expect(hasActivePaidSubscription(derived)).toBe(true);
    },
    180_000,
  );
});
