import "server-only";

import { Redis } from "@upstash/redis";

let cached: Redis | null | undefined;

/** Returns an Upstash Redis client, or null if not configured. */
export function getRedis(): Redis | null {
  if (cached !== undefined) return cached;
  // Support both the standard @upstash/redis names and the names provisioned
  // by Stripe Projects (UPSTASH_REST_URL / UPSTASH_REST_TOKEN).
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REST_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REST_TOKEN;
  cached = url && token ? new Redis({ url, token }) : null;
  return cached;
}

/**
 * Atomically increments a counter with a TTL window and returns the new count.
 * Falls back to an in-memory counter when Redis is unavailable (dev only).
 */
const memory = new Map<string, { count: number; expires: number }>();

export async function incrementWithTtl(
  key: string,
  ttlSeconds: number,
): Promise<number> {
  const redis = getRedis();
  if (redis) {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, ttlSeconds);
    return count;
  }
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.expires < now) {
    memory.set(key, { count: 1, expires: now + ttlSeconds * 1000 });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}
