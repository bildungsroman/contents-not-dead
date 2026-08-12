/**
 * Central app configuration. Values here are safe to import from both server
 * and client components unless explicitly noted as server-only.
 */

export const THEMES = ["minimalist", "bookworm", "maximalist"] as const;
export type Theme = (typeof THEMES)[number];

/** Default theme for open-source clones. Override with NEXT_PUBLIC_DEFAULT_THEME. */
export const DEFAULT_THEME: Theme =
  (process.env.NEXT_PUBLIC_DEFAULT_THEME as Theme | undefined) &&
  THEMES.includes(process.env.NEXT_PUBLIC_DEFAULT_THEME as Theme)
    ? (process.env.NEXT_PUBLIC_DEFAULT_THEME as Theme)
    : "minimalist";

/**
 * Demo mode. When on, the maximalist theme + theme switcher + on-demand
 * content generation become available. This is a public flag so the client can
 * render the switcher; server-only generation is additionally host-gated (see
 * `isGenerationAllowed`).
 */
export const IS_DEMO = process.env.NEXT_PUBLIC_IS_DEMO === "true";

/** Themes selectable in the UI. The maximalist theme is demo-only. */
export const AVAILABLE_THEMES: readonly Theme[] = IS_DEMO
  ? THEMES
  : THEMES.filter((t) => t !== "maximalist");

/** Per-content price charged to agents over MPP, in USD. */
export const PER_CONTENT_PRICE_USD = "0.50";

export const SUBSCRIPTION = {
  monthly: { amount: 5, interval: "month" as const, label: "$5 / month" },
  annual: { amount: 50, interval: "year" as const, label: "$50 / year" },
};

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
