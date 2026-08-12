/**
 * Idempotently creates the subscription Product + Prices and a Billing Portal
 * configuration for Content's Not Dead.
 *
 * Run with the Stripe key loaded from your env file (never printed):
 *   node --env-file=.env scripts/setup-stripe.mjs
 *
 * Prints the price IDs so they can be stored as project variables.
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is not set");
  process.exit(1);
}

const stripe = new Stripe(key);

const PRODUCT_NAME = "Content's Not Dead — Unlimited";
const MONTHLY_LOOKUP = "cnd_sub_monthly";
const ANNUAL_LOOKUP = "cnd_sub_annual";

async function findOrCreateProduct() {
  const existing = await stripe.products.search({
    query: `metadata['app']:'contents-not-dead' AND active:'true'`,
  });
  if (existing.data.length > 0) return existing.data[0];
  return stripe.products.create({
    name: PRODUCT_NAME,
    description: "Unlimited access to all content on Content's Not Dead.",
    metadata: { app: "contents-not-dead", role: "subscription" },
  });
}

async function findOrCreatePrice({ product, lookupKey, amount, interval }) {
  const existing = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  if (existing.data.length > 0) return existing.data[0];
  return stripe.prices.create({
    product,
    unit_amount: amount,
    currency: "usd",
    recurring: { interval },
    lookup_key: lookupKey,
    metadata: { app: "contents-not-dead" },
  });
}

async function ensurePortalConfig() {
  const configs = await stripe.billingPortal.configurations.list({ limit: 1 });
  if (configs.data.length > 0) return configs.data[0];
  return stripe.billingPortal.configurations.create({
    business_profile: {
      headline: "Content's Not Dead — manage your subscription",
    },
    features: {
      subscription_cancel: { enabled: true, mode: "at_period_end" },
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
    },
  });
}

async function main() {
  const product = await findOrCreateProduct();
  const monthly = await findOrCreatePrice({
    product: product.id,
    lookupKey: MONTHLY_LOOKUP,
    amount: 500,
    interval: "month",
  });
  const annual = await findOrCreatePrice({
    product: product.id,
    lookupKey: ANNUAL_LOOKUP,
    amount: 5000,
    interval: "year",
  });
  const portal = await ensurePortalConfig();

  console.log("PRODUCT_ID=" + product.id);
  console.log("STRIPE_PRICE_MONTHLY=" + monthly.id);
  console.log("STRIPE_PRICE_ANNUAL=" + annual.id);
  console.log("PORTAL_CONFIG_ID=" + portal.id);
}

main().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
