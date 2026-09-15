import { createRequire } from "node:module";
import type { clerkMiddleware as ClerkMiddleware } from "@clerk/nextjs/server";
import { authorizedOrigins } from "@/lib/config";

// Clerk's middleware pulls in Node built-ins (crypto, safe-node-apis) that the
// Edge runtime rejects on Vercel ("referencing unsupported modules"), so we run
// the middleware on the Node.js runtime (stable since Next 15.5).
//
// Under Node + ESM, a bare `import { clerkMiddleware } from "@clerk/nextjs/server"`
// resolves to Clerk's ESM build, whose files are misflagged as CommonJS by the
// package (no "type": "module"), so Node can't see the named export. Loading the
// dedicated CJS build via `require` sidesteps that dual-package hazard.
const require = createRequire(import.meta.url);
const { clerkMiddleware } = require("@clerk/nextjs/server") as {
  clerkMiddleware: typeof ClerkMiddleware;
};

// We don't hard-redirect protected routes — sign-in is a modal and auth-only
// pages (e.g. /account) render an in-page prompt when signed out — so agents
// and anonymous visitors can browse and pay everywhere. Keys are read from the
// standard Clerk env vars.
//
// `authorizedParties` is an allowlist of origins a session may be presented
// from. A production Clerk instance on the root domain shares sessions across
// every subdomain, so without it a compromised sibling subdomain could mint
// sessions this app would honor.
export default clerkMiddleware({ authorizedParties: authorizedOrigins() });

export const config = {
  // Run on all routes except Next internals so Clerk's auth context is always
  // available to the layout (including on not-found pages).
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
