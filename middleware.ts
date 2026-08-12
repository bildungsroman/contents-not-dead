import { clerkMiddleware } from "@clerk/nextjs/server";

// Attach Clerk to requests for auth context. We don't hard-redirect protected
// routes — sign-in is a modal and auth-only pages (e.g. /account) render an
// in-page prompt when signed out — so agents and anonymous visitors can browse
// and pay everywhere. Keys are read from the standard Clerk env vars.
export default clerkMiddleware();

export const config = {
  // Run on all routes except Next internals so Clerk's auth context is always
  // available to the layout (including on not-found pages).
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
