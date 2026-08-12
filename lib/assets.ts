import "server-only";

import { signToken, verifyToken, requireSecret } from "./signing";

const ASSET_TTL_SECONDS = 60 * 10; // 10 minutes

/** Issues a short-lived signed access token for a paid image asset. */
export function issueAssetToken(contentId: string): string {
  return signToken(contentId, requireSecret("CONTENT_ASSET_SECRET"), ASSET_TTL_SECONDS);
}

/** Returns true if `token` grants access to `contentId`. */
export function verifyAssetToken(contentId: string, token: string): boolean {
  const payload = verifyToken(token, requireSecret("CONTENT_ASSET_SECRET"));
  return payload === contentId;
}

/** Builds the relative asset URL including a signed token. */
export function signedAssetPath(contentId: string): string {
  const token = issueAssetToken(contentId);
  return `/api/content/${encodeURIComponent(contentId)}/asset?token=${encodeURIComponent(token)}`;
}
