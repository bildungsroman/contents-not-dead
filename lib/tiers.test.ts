import { describe, expect, it } from "vitest";
import {
  CONTENT_TIERS,
  TIER_FEATURE,
  isContentTier,
  parseContentTier,
} from "./tiers";

describe("parseContentTier", () => {
  it("accepts the known tiers", () => {
    expect(parseContentTier("free")).toBe("free");
    expect(parseContentTier("paid")).toBe("paid");
  });

  // The default decides what happens to every article whose author forgot the
  // field, so it has to fail closed.
  it.each([
    ["missing", undefined],
    ["null", null],
    ["empty", ""],
    ["unknown word", "public"],
    ["wrong case", "Free"],
    ["non-string", 1],
    ["object", { tier: "free" }],
  ])("defaults %s to paid", (_label, value) => {
    expect(parseContentTier(value)).toBe("paid");
  });
});

describe("isContentTier", () => {
  it("narrows only exact tier strings", () => {
    expect(isContentTier("free")).toBe(true);
    expect(isContentTier("paid")).toBe(true);
    expect(isContentTier("FREE")).toBe(false);
    expect(isContentTier(undefined)).toBe(false);
  });
});

describe("TIER_FEATURE", () => {
  it("maps every tier to a distinct entitlement lookup key", () => {
    const keys = CONTENT_TIERS.map((tier) => TIER_FEATURE[tier]);
    expect(keys).toEqual(["cnd_free_content", "cnd_paid_content"]);
    expect(new Set(keys).size).toBe(CONTENT_TIERS.length);
  });

  // These strings must match the lookup keys created by scripts/setup-stripe.mjs.
  // If they drift, every gate silently denies access.
  it("has a lookup key for each tier", () => {
    for (const tier of CONTENT_TIERS) {
      expect(TIER_FEATURE[tier]).toMatch(/^cnd_\w+_content$/);
    }
  });
});
