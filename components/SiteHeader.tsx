import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { IS_DEMO, SITE } from "@/lib/config";
import { Logo } from "./Logo";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { SchemeToggle } from "./SchemeToggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="inner">
        <div className="header-top">
          <Link href="/" className="brand-link" aria-label={`${SITE.name} home`}>
            <span className="brand-title">
              Content&rsquo;s Not Dead
              <Logo className="brand-logo" />
            </span>
          </Link>
          <SchemeToggle />
        </div>
        <nav className="site-nav">
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/subscribe">Subscribe</Link>
            <Link href="/payments">For Agents</Link>
            <Link href="/docs">Docs</Link>
          </div>
          <div className="nav-actions">
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
          </div>
        </nav>
      </div>
    </header>
  );
}
