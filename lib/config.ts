/**
 * Central app configuration. Values here are safe to import from both server
 * and client components unless explicitly noted as server-only.
 */

export const THEMES = ["minimalist", "bookworm", "maximalist"] as const;
export type Theme = (typeof THEMES)[number];

/**
 * Demo mode. When on, the maximalist theme + theme switcher + on-demand
 * content generation become available. This is a public flag so the client can
 * render the switcher; server-only generation is additionally host-gated (see
 * `isGenerationAllowed`).
 */
export const IS_DEMO = process.env.NEXT_PUBLIC_IS_DEMO === "true";

/**
 * Default theme. Override with NEXT_PUBLIC_DEFAULT_THEME. Falls back to the
 * maximalist theme on the demo site, and minimalist for open-source clones.
 */
export const DEFAULT_THEME: Theme =
  (process.env.NEXT_PUBLIC_DEFAULT_THEME as Theme | undefined) &&
  THEMES.includes(process.env.NEXT_PUBLIC_DEFAULT_THEME as Theme)
    ? (process.env.NEXT_PUBLIC_DEFAULT_THEME as Theme)
    : IS_DEMO
      ? "maximalist"
      : "minimalist";

/** Themes selectable in the UI. The maximalist theme is demo-only. */
export const AVAILABLE_THEMES: readonly Theme[] = IS_DEMO
  ? THEMES
  : THEMES.filter((t) => t !== "maximalist");

/** Per-content price charged to agents over MPP, in USD. */
export const PER_CONTENT_PRICE_USD = "0.50";

export const SUBSCRIPTION = {
  free: { amount: 0, interval: "month" as const, label: "Free" },
  monthly: { amount: 5, interval: "month" as const, label: "$5 / month" },
  annual: { amount: 50, interval: "year" as const, label: "$50 / year" },
};

/** Plans a signed-in human can buy. The free tier is granted, not purchased. */
export const PURCHASABLE_PLANS = ["monthly", "annual"] as const;
export type PurchasablePlan = (typeof PURCHASABLE_PLANS)[number];

export const SITE = {
  name: "Content's Not Dead",
  tagline: "A content platform humans and agents can both pay for.",
  description:
    "An open-source, themeable content platform monetized with Stripe subscriptions and per-content Machine Payments Protocol (MPP) payments.",
  repo: "https://github.com/bildungsroman/contents-not-dead",
};

export function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

/**
 * The public origin agents call: the one advertised in `/openapi.json`, used
 * for paid resource URLs, and echoed as the MPP challenge realm. It is split
 * from `appUrl()` so the agent surface can live on its own hostname while
 * human pages stay where they are. Falls back to `appUrl()` for clones that
 * serve both from a single origin.
 */
export function apiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || appUrl();
}

/**
 * Hostname of `apiUrl()`, used as the MPP `WWW-Authenticate` realm.
 *
 * This must be derived from the public origin rather than left to mppx's env
 * fallback chain, which would otherwise resolve `VERCEL_URL` to the internal
 * per-deployment hostname and produce a realm agents can't match.
 */
export function apiRealm(): string {
  try {
    return new URL(apiUrl()).host;
  } catch {
    return apiUrl();
  }
}

/** Contact address published in `/openapi.json`, enabling origin ownership verification. */
export function contactEmail(): string | undefined {
  return process.env.MPP_CONTACT_EMAIL || undefined;
}

/**
 * Origins allowed to present a Clerk session.
 *
 * Clerk's Frontend API accepts requests from any subdomain of its instance's
 * root domain by default, so a compromised sibling subdomain could mint
 * sessions for this app. Restricting the list to the origins actually served
 * closes that off. Vercel's deployment hostnames are included because previews
 * are legitimate origins that aren't known at configuration time.
 */
export function authorizedOrigins(): string[] {
  const origins = new Set([appUrl(), apiUrl()]);
  for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
    if (host) origins.add(`https://${host}`);
  }
  return [...origins];
}
