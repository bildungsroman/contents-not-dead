import "server-only";

import { auth, createClerkClient } from "@clerk/nextjs/server";
import { getStripe } from "./stripe";
import { getClerkKeys } from "./clerk-keys";

/** Backend Clerk client configured with the resolved secret key. */
function clerkClient() {
  return createClerkClient({ secretKey: getClerkKeys().secretKey });
}

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "none";

export interface SubscriptionState {
  stripeCustomerId?: string;
  status: SubscriptionStatus;
  plan?: "monthly" | "annual";
  currentPeriodEnd?: number; // unix seconds
}

const ACTIVE_STATUSES: SubscriptionStatus[] = ["active", "trialing"];

export function isActive(state: SubscriptionState | null | undefined): boolean {
  if (!state) return false;
  if (!ACTIVE_STATUSES.includes(state.status)) return false;
  if (state.currentPeriodEnd && state.currentPeriodEnd * 1000 < Date.now()) {
    return false;
  }
  return true;
}

function fromMetadata(meta: Record<string, unknown> | undefined): SubscriptionState {
  const sub = (meta?.subscription ?? {}) as Record<string, unknown>;
  return {
    stripeCustomerId: (meta?.stripeCustomerId as string) || undefined,
    status: (sub.status as SubscriptionStatus) || "none",
    plan: (sub.plan as "monthly" | "annual") || undefined,
    currentPeriodEnd: (sub.currentPeriodEnd as number) || undefined,
  };
}

/** Reads the current signed-in user's subscription state from Clerk metadata. */
export async function getSubscriptionState(): Promise<{
  userId: string | null;
  state: SubscriptionState;
}> {
  const { userId } = await auth();
  if (!userId) return { userId: null, state: { status: "none" } };
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const state = fromMetadata(user.publicMetadata as Record<string, unknown>);

  // Revalidate against Stripe if metadata looks stale (expired period).
  if (
    state.stripeCustomerId &&
    state.currentPeriodEnd &&
    state.currentPeriodEnd * 1000 < Date.now()
  ) {
    try {
      const fresh = await fetchSubscriptionFromStripe(state.stripeCustomerId);
      if (fresh) {
        await writeSubscriptionState(userId, state.stripeCustomerId, fresh);
        return { userId, state: { ...state, ...fresh } };
      }
    } catch {
      // Fall through to whatever metadata we have.
    }
  }

  return { userId, state };
}

/** True if the currently signed-in user has an active subscription. */
export async function currentUserHasActiveSubscription(): Promise<boolean> {
  const { state } = await getSubscriptionState();
  return isActive(state);
}

interface StripeDerivedState {
  status: SubscriptionStatus;
  plan?: "monthly" | "annual";
  currentPeriodEnd?: number;
}

function planFromPriceId(priceId: string | undefined): "monthly" | "annual" | undefined {
  if (!priceId) return undefined;
  if (priceId === process.env.STRIPE_PRICE_ANNUAL) return "annual";
  if (priceId === process.env.STRIPE_PRICE_MONTHLY) return "monthly";
  return undefined;
}

/** Fetches the most relevant subscription for a customer directly from Stripe. */
export async function fetchSubscriptionFromStripe(
  customerId: string,
): Promise<StripeDerivedState | null> {
  const stripe = getStripe();
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });
  if (subs.data.length === 0) return null;
  const priority: Record<string, number> = {
    active: 5,
    trialing: 4,
    past_due: 3,
    incomplete: 2,
    canceled: 1,
  };
  const best = [...subs.data].sort(
    (a, b) => (priority[b.status] ?? 0) - (priority[a.status] ?? 0),
  )[0];
  return deriveFromSubscription(best);
}

export function deriveFromSubscription(
  sub: import("stripe").Stripe.Subscription,
): StripeDerivedState {
  const item = sub.items.data[0];
  // `current_period_end` lives on the subscription item in newer API versions
  // and on the subscription in older ones; read whichever is present.
  const periodEnd =
    (item as unknown as { current_period_end?: number })?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;
  return {
    status: (sub.status as SubscriptionStatus) ?? "none",
    plan: planFromPriceId(item?.price?.id),
    currentPeriodEnd: periodEnd,
  };
}

/** Persists subscription state onto the Clerk user's public metadata. */
export async function writeSubscriptionState(
  userId: string,
  stripeCustomerId: string,
  derived: StripeDerivedState,
): Promise<void> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const existing = (user.publicMetadata ?? {}) as Record<string, unknown>;
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...existing,
      stripeCustomerId,
      subscription: {
        status: derived.status,
        plan: derived.plan,
        currentPeriodEnd: derived.currentPeriodEnd,
        updatedAt: Math.floor(Date.now() / 1000),
      },
    },
  });
}

/**
 * Returns the Stripe customer id for a Clerk user, creating one if needed.
 * The customer's metadata records `clerkUserId` so webhooks can map back.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
): Promise<string> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const existing = (user.publicMetadata as Record<string, unknown>)
    ?.stripeCustomerId as string | undefined;
  if (existing) return existing;

  const stripe = getStripe();
  const email = user.primaryEmailAddress?.emailAddress;
  const customer = await stripe.customers.create({
    email,
    metadata: { clerkUserId: userId, app: "contents-not-dead" },
  });

  const meta = (user.publicMetadata ?? {}) as Record<string, unknown>;
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { ...meta, stripeCustomerId: customer.id },
  });
  return customer.id;
}

/** Finds a Clerk userId given a Stripe customer id (used by webhooks). */
export async function findUserByStripeCustomer(
  customerId: string,
): Promise<string | null> {
  const client = await clerkClient();
  const res = await client.users.getUserList({
    limit: 100,
  });
  const match = res.data.find(
    (u) =>
      (u.publicMetadata as Record<string, unknown>)?.stripeCustomerId ===
      customerId,
  );
  return match?.id ?? null;
}
