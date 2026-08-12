import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { IS_DEMO, SITE } from "@/lib/config";
import { Logo } from "./Logo";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="inner">
        <div className="brand">
          <Link href="/" aria-label={`${SITE.name} home`}>
            <span className="brand" style={{ gap: 14 }}>
              <Logo className="brand-logo" />
              <span className="brand-title">Content&rsquo;s Not Dead</span>
            </span>
          </Link>
        </div>
        <nav className="site-nav">
          <Link href="/">Home</Link>
          <Link href="/subscribe">Subscribe</Link>
          <Link href="/payments">For Agents</Link>
          <Link href="/docs">Docs</Link>
          <SignedIn>
            <Link href="/account">Account</Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn secondary">Sign in</button>
            </SignInButton>
          </SignedOut>
          {IS_DEMO ? <ThemeSwitcher /> : null}
        </nav>
      </div>
    </header>
  );
}
