import "server-only";

import { headers } from "next/headers";
import { hasFeature } from "./subscription";
import { type ContentTier, TIER_FEATURE } from "./tiers";

const LOCAL_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "[::1]",
  "0.0.0.0",
]);

/**
 * True when the request is being served to a local developer machine, so paid
 * content can be read without subscribing.
 *
 * Always false on Vercel, which means a spoofed `Host: localhost` header on a
 * real deployment can never unlock content. Set `LOCAL_FULL_ACCESS=false` to
 * exercise the real paywall locally.
 */
export async function isLocalRequest(): Promise<boolean> {
  if (process.env.VERCEL) return false;
  if (process.env.LOCAL_FULL_ACCESS === "false") return false;
  try {
    const host = (await headers()).get("host");
    if (!host) return false;
    const hostname = host.toLowerCase().replace(/:\d+$/, "");
    return LOCAL_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost");
  } catch {
    // Called outside a request scope (e.g. a build-time prerender).
    return false;
  }
}

/**
 * Whether the caller may read a post of the given tier on the website: the
 * matching Stripe entitlement, or any request served locally.
 *
 * Agent-facing routes deliberately call `hasFeature` directly instead, so the
 * localhost shortcut never hands out content that should have been paid for.
 */
export async function canRead(tier: ContentTier): Promise<boolean> {
  if (await isLocalRequest()) return true;
  return hasFeature(TIER_FEATURE[tier]);
}
