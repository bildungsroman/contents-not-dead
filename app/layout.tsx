import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Rubik_Glitch, Space_Mono, Doto } from "next/font/google";
import { DEFAULT_THEME, SITE, THEMES, type Theme } from "@/lib/config";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { THEME_COOKIE, SCHEME_COOKIE, type Scheme } from "@/lib/theme-shared";
import { getClerkKeys } from "@/lib/clerk-keys";
import "./globals.css";

const rubikGlitch = Rubik_Glitch({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-rubik-glitch",
  display: "swap",
});
const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});
const doto = Doto({
  subsets: ["latin"],
  variable: "--font-doto",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: SITE.name,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  other: {
    // Point agents at the machine-readable discovery documents.
    "mpp-discovery": "/.well-known/mpp.json",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get(THEME_COOKIE)?.value as Theme | undefined;
  const theme: Theme =
    cookieTheme && THEMES.includes(cookieTheme) ? cookieTheme : DEFAULT_THEME;

  const cookieScheme = cookieStore.get(SCHEME_COOKIE)?.value;
  const scheme: Scheme | undefined =
    cookieScheme === "light" || cookieScheme === "dark"
      ? cookieScheme
      : undefined;

  // The maximalist theme's display faces. `next/font` self-hosts them, so
  // themes that don't reference the variables cost nothing to serve.
  const fontVars = `${rubikGlitch.variable} ${spaceMono.variable} ${doto.variable}`;

  const clerkKeys = getClerkKeys();

  return (
    <ClerkProvider
      publishableKey={clerkKeys.publishableKey}
      afterSignOutUrl="/"
    >
      <html
        lang="en"
        data-theme={theme}
        data-scheme={scheme}
        className={fontVars}
      >
        <body>
          <SiteHeader />
          {children}
          <SiteFooter />
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
