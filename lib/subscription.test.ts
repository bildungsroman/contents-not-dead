import type Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type CachedMetadata,
  deriveFromSubscription,
  isActive,
  isPaidPlan,
  needsRevalidation,
  type SubscriptionStatus,
} from "./subscription";
import { CONTENT_TIERS, TIER_FEATURE, type ContentTier } from "./tiers";

const MONTHLY = "price_monthly_test";
const ANNUAL = "price_annual_test";
const FREE = "price_free_test";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.STRIPE_PRICE_MONTHLY = MONTHLY;
  process.env.STRIPE_PRICE_ANNUAL = ANNUAL;
  process.env.STRIPE_PRICE_FREE = FREE;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function subscription({
  priceId,
  status = "active",
  currentPeriodEnd = 2_000_000_000,
}: {
  priceId?: string;
  status?: string;
  currentPeriodEnd?: number;
}): Stripe.Subscription {
  return {
    status,
    items: {
      data: [
        {
          current_period_end: currentPeriodEnd,
          price: priceId ? { id: priceId } : undefined,
        },
      ],
    },
  } as unknown as Stripe.Subscription;
}

describe("deriveFromSubscription", () => {
  it.each([
    [MONTHLY, "monthly"],
    [ANNUAL, "annual"],
    [FREE, "free"],
  ])("maps price %s to the %s plan", (priceId, expected) => {
    expect(deriveFromSubscription(subscription({ priceId })).plan).toBe(
      expected,
    );
  });

  it("leaves the plan undefined for an unrecognised price", () => {
    expect(
      deriveFromSubscription(subscription({ priceId: "price_legacy" })).plan,
    ).toBeUndefined();
  });

  // On API version 2026-08-26.dahlia the period lives on the subscription item,
  // not the subscription, so reading the wrong one yields undefined and makes
  // every subscription look permanently valid.
  it("reads current_period_end from the subscription item", () => {
    const derived = deriveFromSubscription(
      subscription({ priceId: MONTHLY, currentPeriodEnd: 1_234_567_890 }),
    );
    expect(derived.currentPeriodEnd).toBe(1_234_567_890);
  });

  it("carries the subscription status through", () => {
    expect(
      deriveFromSubscription(subscription({ priceId: FREE, status: "past_due" }))
        .status,
    ).toBe("past_due");
  });
});

describe("isPaidPlan", () => {
  it("counts only the purchasable plans as paid", () => {
    expect(isPaidPlan("monthly")).toBe(true);
    expect(isPaidPlan("annual")).toBe(true);
    // The whole free tier rests on this: a $0 subscription is active but not
    // paid, so the account and subscribe pages must not treat it as a purchase.
    expect(isPaidPlan("free")).toBe(false);
    expect(isPaidPlan(undefined)).toBe(false);
  });
});

describe("isActive", () => {
  const future = Math.floor(Date.now() / 1000) + 3600;
  const past = Math.floor(Date.now() / 1000) - 3600;

  it("accepts live statuses within the current period", () => {
    expect(isActive({ status: "active", currentPeriodEnd: future })).toBe(true);
    expect(isActive({ status: "trialing", currentPeriodEnd: future })).toBe(
      true,
    );
  });

  it("rejects dead statuses and lapsed periods", () => {
    expect(isActive({ status: "canceled", currentPeriodEnd: future })).toBe(
      false,
    );
    expect(isActive({ status: "past_due", currentPeriodEnd: future })).toBe(
      false,
    );
    expect(isActive({ status: "active", currentPeriodEnd: past })).toBe(false);
    expect(isActive(null)).toBe(false);
  });
});

describe("needsRevalidation", () => {
  const now = () => Math.floor(Date.now() / 1000);

  function cached(overrides: {
    entitlements?: string[];
    ageSeconds?: number;
    status?: SubscriptionStatus;
    stripeCustomerId?: string;
    entitlementsUpdatedAt?: number;
  }): CachedMetadata {
    const {
      entitlements = ["cnd_free_content"],
      ageSeconds = 0,
      status = "active",
    } = overrides;
    return {
      state: {
        stripeCustomerId:
          "stripeCustomerId" in overrides
            ? overrides.stripeCustomerId
            : "cus_test",
        status,
        currentPeriodEnd: now() + 3600,
      },
      entitlements: new Set(entitlements),
      entitlementsUpdatedAt:
        "entitlementsUpdatedAt" in overrides
          ? overrides.entitlementsUpdatedAt
          : now() - ageSeconds,
    };
  }

  it("revalidates when there is nothing worth trusting yet", () => {
    expect(needsRevalidation(cached({ stripeCustomerId: undefined }))).toBe(
      true,
    );
    expect(needsRevalidation(cached({ entitlementsUpdatedAt: undefined }))).toBe(
      true,
    );
  });

  it("revalidates when the cached subscription is not live", () => {
    expect(needsRevalidation(cached({ status: "canceled" }))).toBe(true);
  });

  // Stripe computes entitlements asynchronously, so an empty set right after
  // provisioning is normal. Retry, but not on every request.
  it("backs off briefly on an active subscription with no entitlements", () => {
    expect(needsRevalidation(cached({ entitlements: [], ageSeconds: 5 }))).toBe(
      false,
    );
    expect(needsRevalidation(cached({ entitlements: [], ageSeconds: 31 }))).toBe(
      true,
    );
  });

  it("trusts a freshly written entitlement set", () => {
    expect(needsRevalidation(cached({ ageSeconds: 60 }))).toBe(false);
  });

  // The regression this guards: a populated cache used to be trusted forever,
  // so a webhook that never arrived (wrong signing secret, disabled endpoint)
  // pinned the reader to their old plan and an upgrade was invisible.
  it("expires a populated entitlement set once webhooks have gone quiet", () => {
    expect(needsRevalidation(cached({ ageSeconds: 15 * 60 + 1 }))).toBe(true);
  });
});

/**
 * The access matrix every gate implements as
 * `entitlements.has(TIER_FEATURE[post.access])`. These sets are what each
 * Stripe product grants: Free grants the free feature, Unlimited grants both.
 */
describe("entitlement matching", () => {
  const anonymous = new Set<string>();
  const freeTier = new Set([TIER_FEATURE.free]);
  const paidTier = new Set([TIER_FEATURE.free, TIER_FEATURE.paid]);

  const canRead = (entitlements: Set<string>, tier: ContentTier) =>
    entitlements.has(TIER_FEATURE[tier]);

  it("gives anonymous callers nothing — they pay per item instead", () => {
    for (const tier of CONTENT_TIERS) {
      expect(canRead(anonymous, tier)).toBe(false);
    }
  });

  it("gives the free tier free content only", () => {
    expect(canRead(freeTier, "free")).toBe(true);
    expect(canRead(freeTier, "paid")).toBe(false);
  });

  it("gives the paid tier everything", () => {
    for (const tier of CONTENT_TIERS) {
      expect(canRead(paidTier, tier)).toBe(true);
    }
  });
});
