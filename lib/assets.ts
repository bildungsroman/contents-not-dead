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

/**
 * Builds the relative asset URL including a signed token. `file` selects an
 * inline asset referenced by the post body; omit it for the post's own image.
 */
export function signedAssetPath(contentId: string, file?: string): string {
  const params = new URLSearchParams({ token: issueAssetToken(contentId) });
  if (file) params.set("file", file);
  return `/api/content/${encodeURIComponent(contentId)}/asset?${params}`;
}

/** `/content/assets/…` is the path authors write in markdown. */
const INLINE_ASSET_URL = /\/content\/assets\/([^\s)"']+)/g;

function decodeFilename(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Rewrites inline `/content/assets/<file>` markdown URLs to signed API paths.
 * Assets live outside `public/`, so they are only ever served by the
 * access-checked asset route — never as static files. Pass `baseUrl` when the
 * markdown leaves the site (e.g. agent responses) and needs absolute URLs.
 */
export function resolveInlineAssets(
  contentId: string,
  markdown: string,
  baseUrl = "",
): string {
  return markdown.replace(
    INLINE_ASSET_URL,
    (_match, file: string) =>
      `${baseUrl}${signedAssetPath(contentId, decodeFilename(file))}`,
  );
}
