"use client";

import { useEffect, useState } from "react";
import { SCHEME_COOKIE, type Scheme } from "@/lib/theme-shared";

/** Toggles light/dark, overriding the OS preference. Persists via cookie. */
export function SchemeToggle() {
  const [scheme, setScheme] = useState<Scheme | null>(null);

  useEffect(() => {
    const forced = document.documentElement.getAttribute(
      "data-scheme",
    ) as Scheme | null;
    if (forced === "light" || forced === "dark") {
      setScheme(forced);
    } else {
      setScheme(
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
      );
    }
  }, []);

  function toggle() {
    const next: Scheme = scheme === "dark" ? "light" : "dark";
    setScheme(next);
    document.documentElement.setAttribute("data-scheme", next);
    document.cookie = `${SCHEME_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }

  // Avoid a hydration mismatch: render a neutral, non-interactive placeholder
  // until we know the effective scheme on the client.
  const isDark = scheme === "dark";
  const label =
    scheme === null
      ? "Toggle color scheme"
      : `Switch to ${isDark ? "light" : "dark"} mode`;

  return (
    <button
      type="button"
      className="scheme-toggle"
      onClick={toggle}
      aria-label={label}
      title={label}
      suppressHydrationWarning
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22" />
        <line x1="2" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22" y2="12" />
        <line x1="4.9" y1="4.9" x2="6.3" y2="6.3" />
        <line x1="17.7" y1="17.7" x2="19.1" y2="19.1" />
        <line x1="4.9" y1="19.1" x2="6.3" y2="17.7" />
        <line x1="17.7" y1="6.3" x2="19.1" y2="4.9" />
      </g>
    </svg>
  );
}
