/**
 * Runs once when the Node.js server starts. We normalize the Clerk credentials
 * provisioned by Stripe Projects (a JSON blob) into the discrete env vars the
 * Clerk SDK reads, so `auth()`, `clerkClient()`, and middleware work without
 * each call site having to parse the blob.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getClerkKeys } = await import("./lib/clerk-keys");
  const keys = getClerkKeys();
  if (keys.secretKey && !process.env.CLERK_SECRET_KEY) {
    process.env.CLERK_SECRET_KEY = keys.secretKey;
  }
  if (
    keys.publishableKey &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ) {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = keys.publishableKey;
  }
}
