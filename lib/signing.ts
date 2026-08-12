import "server-only";

import crypto from "node:crypto";

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

/**
 * Creates a compact, HMAC-signed token: `<payload>.<exp>.<sig>`.
 * `exp` is a unix-seconds expiry.
 */
export function signToken(
  payload: string,
  secret: string,
  ttlSeconds: number,
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = `${base64url(payload)}.${exp}`;
  const sig = base64url(
    crypto.createHmac("sha256", secret).update(body).digest(),
  );
  return `${body}.${sig}`;
}

/** Verifies a signed token and returns the payload, or null if invalid/expired. */
export function verifyToken(token: string, secret: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedPayload, exp, sig] = parts;
  const body = `${encodedPayload}.${exp}`;
  const expected = base64url(
    crypto.createHmac("sha256", secret).update(body).digest(),
  );
  const sigBuf = fromBase64url(sig);
  const expBuf = fromBase64url(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  if (Number(exp) * 1000 < Date.now()) return null;
  return fromBase64url(encodedPayload).toString("utf8");
}

/** Deterministic secret accessor with a clear error when missing. */
export function requireSecret(name: string): string {
  const value = process.env[name];
  if (!value || value.length < 16) {
    throw new Error(`${name} must be set to a secret of at least 16 chars`);
  }
  return value;
}
