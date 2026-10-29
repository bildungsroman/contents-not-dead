/** Clerk's components read the same CSS variables as the app, so they follow the theme and scheme. app/clerk.css styles individual elements. */
export const clerkAppearance = {
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "var(--auth-accent)",
    colorPrimaryForeground: "var(--accent-contrast)",
    colorForeground: "var(--text)",
    colorMutedForeground: "var(--muted)",
    colorMuted: "var(--overlay)",
    colorNeutral: "var(--text)",
    colorBackground: "var(--bg)",
    colorInput: "var(--bg)",
    colorInputForeground: "var(--text)",
    colorBorder: "var(--auth-border)",
    colorRing: "var(--auth-accent)",
    colorModalBackdrop: "rgba(0, 0, 0, 0.55)",
    fontFamily: "var(--font-body)",
    fontFamilyButtons: "var(--font-accent)",
    borderRadius: "var(--radius)",
  },
} as const;
