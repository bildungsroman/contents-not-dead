import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Rubik_Glitch, Space_Mono, Doto } from "next/font/google";
import "./globals.css";
import { DEFAULT_THEME, IS_DEMO, SITE, THEMES, type Theme } from "@/lib/config";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { THEME_COOKIE } from "@/lib/theme-shared";
import { getClerkKeys } from "@/lib/clerk-keys";

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
    IS_DEMO && cookieTheme && THEMES.includes(cookieTheme)
      ? cookieTheme
      : DEFAULT_THEME;

  const fontVars = IS_DEMO
    ? `${rubikGlitch.variable} ${spaceMono.variable} ${doto.variable}`
    : "";

  const clerkKeys = getClerkKeys();

  return (
    <ClerkProvider publishableKey={clerkKeys.publishableKey}>
      <html lang="en" data-theme={theme} className={fontVars}>
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
