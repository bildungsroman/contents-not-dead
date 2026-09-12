/**
 * Content tiers and the Stripe entitlement features that unlock them.
 *
 * Safe to import from client components — no `server-only`, no secrets.
 */

export const CONTENT_TIERS = ["free", "paid"] as const;

/**
 * What a *signed-in human* needs in order to read an article. This is not a
 * "free to the world" switch: callers without a session pay per item over MPP
 * for every article regardless of its tier.
 */
export type ContentTier = (typeof CONTENT_TIERS)[number];

/** Stripe entitlement feature `lookup_key` required to read each tier. */
export const TIER_FEATURE: Record<ContentTier, string> = {
  free: "cnd_free_content",
  paid: "cnd_paid_content",
};

export function isContentTier(value: unknown): value is ContentTier {
  return CONTENT_TIERS.includes(value as ContentTier);
}

/** Parses a frontmatter `access` value, defaulting to the safer `paid`. */
export function parseContentTier(value: unknown): ContentTier {
  return isContentTier(value) ? value : "paid";
}
