import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { IS_DEMO, SITE } from "@/lib/config";
import { Logo } from "./Logo";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { SchemeToggle } from "./SchemeToggle";
import { Button } from "./Button";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  return (
    <header className={styles.siteHeader}>
      <div className={styles.inner}>
        <div className={styles.headerTop}>
          <Link
            href="/"
            className={styles.brandLink}
            aria-label={`${SITE.name} home`}
          >
            <span className={styles.brandTitle}>
              <span className={styles.brandText}>Content&rsquo;s Not Dead</span>
              <Logo className={styles.brandLogo} />
            </span>
          </Link>
          <SchemeToggle />
        </div>
        <nav className={styles.siteNav}>
          <div className={styles.navLinks}>
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/subscribe">Subscribe</Link>
            <Link href="/payments">For Agents</Link>
            <Link href="/docs">Docs</Link>
          </div>
          <div className={styles.navActions}>
            <Show when="signed-in">
              <Link href="/account">Account</Link>
              <UserButton />
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button variant="secondary" className={styles.navButton}>
                  Sign in
                </Button>
              </SignInButton>
            </Show>
            {IS_DEMO ? <ThemeSwitcher /> : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
