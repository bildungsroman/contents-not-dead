/**
 * Idempotently creates the entitlement Features, the Free and Unlimited
 * subscription Products + Prices, and a Billing Portal configuration for
 * Content's Not Dead.
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
const FREE_PRODUCT_NAME = "Content's Not Dead — Free";
const MONTHLY_LOOKUP = "cnd_sub_monthly";
const ANNUAL_LOOKUP = "cnd_sub_annual";
const FREE_LOOKUP = "cnd_sub_free";

// Entitlement features. Attaching one to a product means every customer with an
// active subscription to that product is entitled to the feature, which is what
// the app reads to decide whether a signed-in human may read an article.
const FREE_FEATURE = "cnd_free_content";
const PAID_FEATURE = "cnd_paid_content";

async function findPriceByLookupKey(lookupKey) {
  const existing = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  return existing.data[0] ?? null;
}

/**
 * Resolves the product that features must be attached to.
 *
 * The price is the source of truth, not a product search: an account can hold
 * several products with the same name and metadata, and attaching features to
 * the wrong one grants entitlements to nobody. Whichever product the existing
 * price belongs to is by definition the one customers subscribe to.
 */
async function resolveProduct({ role, name, description, priceLookupKeys }) {
  for (const lookupKey of priceLookupKeys) {
    const price = await findPriceByLookupKey(lookupKey);
    if (price) {
      return typeof price.product === "string"
        ? await stripe.products.retrieve(price.product)
        : price.product;
    }
  }
  return stripe.products.create({
    name,
    description,
    metadata: { app: "contents-not-dead", role },
  });
}

async function findOrCreateFeature({ lookupKey, name }) {
  const existing = await stripe.entitlements.features.list({
    lookup_key: lookupKey,
    limit: 1,
  });
  if (existing.data.length > 0) return existing.data[0];
  return stripe.entitlements.features.create({
    name,
    lookup_key: lookupKey,
    metadata: { app: "contents-not-dead" },
  });
}

/** Attaches a feature to a product unless it is already attached. */
async function attachFeature(productId, featureId) {
  for await (const pf of stripe.products.listFeatures(productId, {
    limit: 100,
  })) {
    if (pf.entitlement_feature?.id === featureId) return pf;
  }
  return stripe.products.createFeature(productId, {
    entitlement_feature: featureId,
  });
}

async function findOrCreatePrice({ product, lookupKey, amount, interval }) {
  const existing = await findPriceByLookupKey(lookupKey);
  if (existing) return existing;
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
  const freeFeature = await findOrCreateFeature({
    lookupKey: FREE_FEATURE,
    name: "Free content",
  });
  const paidFeature = await findOrCreateFeature({
    lookupKey: PAID_FEATURE,
    name: "Paid content",
  });

  const product = await resolveProduct({
    role: "subscription",
    name: PRODUCT_NAME,
    description: "Unlimited access to all content on Content's Not Dead.",
    priceLookupKeys: [MONTHLY_LOOKUP, ANNUAL_LOOKUP],
  });
  const freeProduct = await resolveProduct({
    role: "free-subscription",
    name: FREE_PRODUCT_NAME,
    description: "Access to free content on Content's Not Dead.",
    priceLookupKeys: [FREE_LOOKUP],
  });

  // Unlimited grants both features; Free grants only the free one.
  await attachFeature(product.id, freeFeature.id);
  await attachFeature(product.id, paidFeature.id);
  await attachFeature(freeProduct.id, freeFeature.id);

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
  const free = await findOrCreatePrice({
    product: freeProduct.id,
    lookupKey: FREE_LOOKUP,
    amount: 0,
    interval: "month",
  });
  const portal = await ensurePortalConfig();

  console.log("PRODUCT_ID=" + product.id);
  console.log("FREE_PRODUCT_ID=" + freeProduct.id);
  console.log("STRIPE_PRICE_MONTHLY=" + monthly.id);
  console.log("STRIPE_PRICE_ANNUAL=" + annual.id);
  console.log("STRIPE_PRICE_FREE=" + free.id);
  console.log("PORTAL_CONFIG_ID=" + portal.id);
}

main().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
