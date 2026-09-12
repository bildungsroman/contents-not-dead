import "server-only";

import { cache } from "react";
import type Stripe from "stripe";
import { auth, createClerkClient } from "@clerk/nextjs/server";
import { getStripe, isStripeConfigured } from "./stripe";
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

/** `free` is the $0/month plan every signed-in user is subscribed to. */
export type SubscriptionPlan = "free" | "monthly" | "annual";

export interface SubscriptionState {
  stripeCustomerId?: string;
  status: SubscriptionStatus;
  plan?: SubscriptionPlan;
  currentPeriodEnd?: number; // unix seconds
}

/** Everything the access layer needs about the current caller. */
export interface ViewerState {
  userId: string | null;
  state: SubscriptionState;
  /** Stripe entitlement `lookup_key`s the caller currently holds. */
  entitlements: Set<string>;
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

/** True when the plan is one of the paid tiers (i.e. not the $0 free plan). */
export function isPaidPlan(plan: SubscriptionPlan | undefined): boolean {
  return plan === "monthly" || plan === "annual";
}

interface CachedMetadata {
  state: SubscriptionState;
  entitlements: Set<string>;
  entitlementsUpdatedAt?: number;
}

function fromMetadata(meta: Record<string, unknown> | undefined): CachedMetadata {
  const sub = (meta?.subscription ?? {}) as Record<string, unknown>;
  const ent = (meta?.entitlements ?? {}) as Record<string, unknown>;
  const keys = Array.isArray(ent.keys) ? (ent.keys as unknown[]) : [];
  return {
    state: {
      stripeCustomerId: (meta?.stripeCustomerId as string) || undefined,
      status: (sub.status as SubscriptionStatus) || "none",
      plan: (sub.plan as SubscriptionPlan) || undefined,
      currentPeriodEnd: (sub.currentPeriodEnd as number) || undefined,
    },
    entitlements: new Set(keys.map((k) => String(k))),
    entitlementsUpdatedAt: (ent.updatedAt as number) || undefined,
  };
}

/**
 * How long to wait before re-checking a subscription that looks active but
 * carries no entitlements. Stripe computes entitlements asynchronously, so an
 * empty set immediately after provisioning is normal rather than final.
 */
const EMPTY_ENTITLEMENT_RETRY_SECONDS = 30;

/**
 * Whether we should go back to Stripe rather than trust the Clerk cache.
 *
 * Webhooks normally keep the cache fresh, so this is a backstop for the cases
 * where there is nothing to trust yet (a brand new user) or where the cached
 * state says the caller has no live subscription and therefore still needs the
 * free one provisioned.
 */
function needsRevalidation(cached: CachedMetadata): boolean {
  if (!cached.state.stripeCustomerId) return true;
  if (!cached.entitlementsUpdatedAt) return true;
  if (!isActive(cached.state)) return true;
  // An active subscription with no entitlements means we cached the gap before
  // Stripe finished computing them. Retry, but not on every single request.
  if (cached.entitlements.size === 0) {
    const age = Math.floor(Date.now() / 1000) - cached.entitlementsUpdatedAt;
    return age >= EMPTY_ENTITLEMENT_RETRY_SECONDS;
  }
  return false;
}

/**
 * Resolves the current caller: their subscription snapshot and the entitlement
 * keys that decide what they may read.
 *
 * Signed-in users are provisioned on demand — a Stripe customer and the $0
 * subscription are created on first read, which is what grants the free
 * entitlement. Anonymous callers hold no entitlements and pay per item.
 *
 * Memoized per request: a page that gates several things must not re-run
 * provisioning, and the Clerk and Stripe reads are not free.
 */
export const getViewerState = cache(async (): Promise<ViewerState> => {
  const { userId } = await auth();
  if (!userId) {
    return { userId: null, state: { status: "none" }, entitlements: new Set() };
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const cached = fromMetadata(user.publicMetadata as Record<string, unknown>);

  if (!isStripeConfigured() || !needsRevalidation(cached)) {
    return { userId, state: cached.state, entitlements: cached.entitlements };
  }

  try {
    const customerId = await getOrCreateStripeCustomer(userId);
    const provisioned = await ensureFreeSubscription(customerId);
    const derived = (await fetchSubscriptionFromStripe(customerId)) ?? {
      status: "none" as const,
    };
    // Stripe computes entitlements a beat after the subscription goes active,
    // so wait for them on the one request that provisioned it. Otherwise a
    // user would be shown the paywall immediately after signing up.
    const entitlements = provisioned
      ? await fetchEntitlementsWithRetry(customerId)
      : await fetchEntitlements(customerId);
    await writeSubscriptionState(userId, customerId, derived, entitlements);
    return {
      userId,
      state: { stripeCustomerId: customerId, ...derived },
      entitlements,
    };
  } catch {
    // Stripe is unreachable or misconfigured — fall back to whatever we cached
    // rather than failing the page. Worst case the caller sees the paywall.
    return { userId, state: cached.state, entitlements: cached.entitlements };
  }
});

/** Reads the current signed-in user's subscription state. */
export async function getSubscriptionState(): Promise<{
  userId: string | null;
  state: SubscriptionState;
}> {
  const { userId, state } = await getViewerState();
  return { userId, state };
}

/** True if the caller holds the given Stripe entitlement feature. */
export async function hasFeature(lookupKey: string): Promise<boolean> {
  const { entitlements } = await getViewerState();
  return entitlements.has(lookupKey);
}

interface StripeDerivedState {
  status: SubscriptionStatus;
  plan?: SubscriptionPlan;
  currentPeriodEnd?: number;
}

function planFromPriceId(priceId: string | undefined): SubscriptionPlan | undefined {
  if (!priceId) return undefined;
  if (priceId === process.env.STRIPE_PRICE_ANNUAL) return "annual";
  if (priceId === process.env.STRIPE_PRICE_MONTHLY) return "monthly";
  if (priceId === process.env.STRIPE_PRICE_FREE) return "free";
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
  // Prefer a live paid subscription over the free one, so the account page
  // reports the plan the customer is actually paying for.
  const best = [...subs.data].sort((a, b) => {
    const byStatus = (priority[b.status] ?? 0) - (priority[a.status] ?? 0);
    if (byStatus !== 0) return byStatus;
    const aPaid = isPaidPlan(planFromPriceId(a.items.data[0]?.price?.id));
    const bPaid = isPaidPlan(planFromPriceId(b.items.data[0]?.price?.id));
    return Number(bPaid) - Number(aPaid);
  })[0];
  return deriveFromSubscription(best);
}

export function deriveFromSubscription(
  sub: Stripe.Subscription,
): StripeDerivedState {
  const item = sub.items.data[0];
  return {
    status: (sub.status as SubscriptionStatus) ?? "none",
    plan: planFromPriceId(item?.price?.id),
    currentPeriodEnd: item?.current_period_end,
  };
}

/** Reads the customer's active entitlement lookup keys from Stripe. */
export async function fetchEntitlements(
  customerId: string,
): Promise<Set<string>> {
  const stripe = getStripe();
  const keys = new Set<string>();
  for await (const entitlement of stripe.entitlements.activeEntitlements.list({
    customer: customerId,
    limit: 100,
  })) {
    keys.add(entitlement.lookup_key);
  }
  return keys;
}

let warnedMissingFreePrice = false;

function warnMissingFreePrice() {
  if (warnedMissingFreePrice) return;
  warnedMissingFreePrice = true;
  console.warn(
    "[subscription] STRIPE_PRICE_FREE is not set — the free tier is disabled " +
      "and all content will require a paid subscription or MPP payment. " +
      "Run `npm run setup:stripe` and set the printed STRIPE_PRICE_FREE.",
  );
}

/**
 * Reads entitlements, retrying briefly while an empty result is still likely
 * to mean "Stripe hasn't caught up yet" rather than "none". Measured lag after
 * creating a subscription is roughly two seconds.
 */
async function fetchEntitlementsWithRetry(
  customerId: string,
  attempts = 4,
  delayMs = 800,
): Promise<Set<string>> {
  for (let i = 0; i < attempts; i++) {
    const keys = await fetchEntitlements(customerId);
    if (keys.size > 0) return keys;
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  // Give up and cache the empty set; `needsRevalidation` will retry later and
  // the entitlements webhook will correct it as soon as Stripe emits one.
  return new Set();
}

/**
 * Subscribes a customer to the $0 plan unless they already have a live
 * subscription. This is what grants the free-content entitlement, so every
 * signed-in user needs it.
 *
 * Returns true when it actually created the subscription.
 */
export async function ensureFreeSubscription(
  customerId: string,
): Promise<boolean> {
  const priceId = process.env.STRIPE_PRICE_FREE;
  if (!priceId) {
    // Without this price nobody is ever granted the free entitlement and every
    // article stays locked, which is hard to diagnose from the symptom alone.
    warnMissingFreePrice();
    return false;
  }

  const stripe = getStripe();
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });
  const hasLive = subs.data.some((s) =>
    ACTIVE_STATUSES.includes(s.status as SubscriptionStatus),
  );
  if (hasLive) return false;

  // A short idempotency window collapses concurrent first-page-load requests
  // into one subscription. It is deliberately not stable forever: a customer
  // whose paid subscription lapses must be able to get the free one back.
  const bucket = Math.floor(Date.now() / 60_000);
  await stripe.subscriptions.create(
    {
      customer: customerId,
      items: [{ price: priceId }],
      metadata: { app: "contents-not-dead", tier: "free" },
    },
    { idempotencyKey: `free-sub-${customerId}-${bucket}` },
  );
  return true;
}

/**
 * Cancels any free subscription a customer holds alongside a paid one, so an
 * upgrade doesn't leave them billed under two subscriptions.
 */
export async function cancelRedundantFreeSubscriptions(
  customerId: string,
): Promise<void> {
  const freePriceId = process.env.STRIPE_PRICE_FREE;
  if (!freePriceId) return;

  const stripe = getStripe();
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 20,
  });
  const paid = subs.data.filter((s) =>
    isPaidPlan(planFromPriceId(s.items.data[0]?.price?.id)),
  );
  if (paid.length === 0) return;

  const free = subs.data.filter(
    (s) => s.items.data[0]?.price?.id === freePriceId,
  );
  for (const sub of free) {
    await stripe.subscriptions.cancel(sub.id);
  }
}

async function updateMetadata(
  userId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const existing = (user.publicMetadata ?? {}) as Record<string, unknown>;
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { ...existing, ...patch },
  });
}

/** Persists subscription state onto the Clerk user's public metadata. */
export async function writeSubscriptionState(
  userId: string,
  stripeCustomerId: string,
  derived: StripeDerivedState,
  entitlements?: Set<string>,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await updateMetadata(userId, {
    stripeCustomerId,
    subscription: {
      status: derived.status,
      plan: derived.plan,
      currentPeriodEnd: derived.currentPeriodEnd,
      updatedAt: now,
    },
    ...(entitlements
      ? { entitlements: { keys: [...entitlements], updatedAt: now } }
      : {}),
  });
}

/** Persists only the entitlement cache (used by the entitlements webhook). */
export async function writeEntitlements(
  userId: string,
  stripeCustomerId: string,
  entitlements: Set<string>,
): Promise<void> {
  await updateMetadata(userId, {
    stripeCustomerId,
    entitlements: {
      keys: [...entitlements],
      updatedAt: Math.floor(Date.now() / 1000),
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
