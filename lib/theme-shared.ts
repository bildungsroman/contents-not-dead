/** Shared, client-safe theme constants (no server-only imports). */
export const THEME_COOKIE = "cnd_theme";

/** Light/dark override cookie. Absent means "follow the OS/browser". */
export const SCHEME_COOKIE = "cnd_scheme";
export type Scheme = "light" | "dark";
