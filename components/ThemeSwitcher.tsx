"use client";

import { useEffect, useState } from "react";
import { AVAILABLE_THEMES, DEFAULT_THEME, type Theme } from "@/lib/config";
import { THEME_COOKIE } from "@/lib/theme-shared";

/** Demo-only control that switches the active theme and persists it. */
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
    <label className="theme-switcher">
      <span className="hidden">Theme</span>
      <select
        aria-label="Theme"
        value={theme}
        onChange={(e) => change(e.target.value as Theme)}
      >
        {AVAILABLE_THEMES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}
