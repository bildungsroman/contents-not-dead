import "server-only";

import crypto from "node:crypto";
import { signToken, verifyToken, requireSecret } from "./signing";

export { GEN_SESSION_COOKIE, GEN_LIMIT } from "./gen-constants";
const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24h

/** Returns the session id from a signed cookie, or null if missing/invalid. */
export function readSession(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null;
  return verifyToken(cookieValue, requireSecret("MPP_SECRET_KEY"));
}

/** Creates a new signed session token carrying a random session id. */
export function createSession(): { id: string; cookie: string } {
  const id = crypto.randomUUID();
  const cookie = signToken(id, requireSecret("MPP_SECRET_KEY"), SESSION_TTL_SECONDS);
  return { id, cookie };
}
