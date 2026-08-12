/**
 * Stripe Projects provisions Clerk credentials as a single JSON env var
 * (`CLERK_ENVIRONMENTS`) rather than the discrete names the Clerk SDK expects.
 * This adapter extracts the right publishable/secret keys so the rest of the
 * app can use Clerk normally. Open-source clones that configure Clerk manually
 * with the standard env vars also work, since those take precedence.
 */

export interface ClerkKeys {
  publishableKey?: string;
  secretKey?: string;
}

interface ClerkEnvBlock {
  publishable_key?: string;
  secret_key?: string;
  domain?: string;
}

function parseEnvironments(): {
  development?: ClerkEnvBlock;
  production?: ClerkEnvBlock;
} | null {
  const raw =
    process.env.CLERK_ENVIRONMENTS || process.env.CLERK_AUTH_ENVIRONMENTS;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getClerkKeys(): ClerkKeys {
  // Standard env vars win if a clone set them directly.
  const direct: ClerkKeys = {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  };
  if (direct.publishableKey && direct.secretKey) return direct;

  const envs = parseEnvironments();
  if (!envs) return direct;

  // Prefer production keys in production when available.
  const useProduction =
    process.env.NODE_ENV === "production" && envs.production?.publishable_key;
  const block = useProduction ? envs.production : envs.development;

  return {
    publishableKey: direct.publishableKey || block?.publishable_key,
    secretKey: direct.secretKey || block?.secret_key,
  };
}
