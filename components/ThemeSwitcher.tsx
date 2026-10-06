"use client";

import { useEffect, useState } from "react";
import { THEMES, DEFAULT_THEME, type Theme } from "@/lib/config";
import { THEME_COOKIE } from "@/lib/theme-shared";
import styles from "./ThemeSwitcher.module.css";

/** Switches the active theme and persists the choice. */
export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    const current = document.documentElement.getAttribute(
      "data-theme",
    ) as Theme | null;
    if (current) setTheme(current);
  }, []);

  function change(next: Theme) {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    // Persist for SSR on next request (1 year).
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }

  return (
    <label className={styles.themeSwitcher}>
      <span className="hidden">Theme</span>
      <PaletteIcon className={styles.icon} />
      <select
        aria-label="Theme"
        value={theme}
        onChange={(e) => change(e.target.value as Theme)}
      >
        {THEMES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}

function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M5 1h6v1h2v1h1v2h1v4h-1v1h-3v1h-1v2h-1v1H8v1H5v-1H3v-1H2v-1H1V5h1V3h1V2h2V1Zm0 3v2h2V4H5Zm4 0v2h2V4H9Zm-5 4v2h2V8H4Z"
      />
    </svg>
  );
}
