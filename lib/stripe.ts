import "server-only";

import Stripe from "stripe";

let cached: Stripe | null = null;

/** Lazily-instantiated Stripe client. Uses the account's default API version. */
export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  cached = new Stripe(key, {
    appInfo: {
      name: "contents-not-dead",
      url: "https://github.com/stripe-samples/contents-not-dead",
    },
  });
  return cached;
}

/** True when Stripe is configured (used to render graceful fallbacks). */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
