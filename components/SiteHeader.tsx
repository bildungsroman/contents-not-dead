import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { SITE } from "@/lib/config";
import { Logo } from "./Logo";
import { KeyIcon } from "./KeyIcon";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { SchemeToggle } from "./SchemeToggle";
import { ViewToggle } from "./ViewToggle";
import { NavMenu } from "./NavMenu";
import { Button } from "./Button";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  return (
    <header className={styles.siteHeader}>
      <div className={styles.inner}>
        <nav className={styles.siteNav}>
          <div className={styles.navStart}>
            <Link
              href="/"
              className={styles.homeIcon}
              aria-label={`${SITE.name} home`}
            >
              <Logo />
            </Link>
            <ViewToggle />
          </div>
          <NavMenu className={styles.navLinks}>
            <Link href="/about">About</Link>
            <Link href="/docs">Docs</Link>
            <Link href="/subscribe">Subscribe</Link>
          </NavMenu>
          <div className={styles.navActions}>
            <Show when="signed-in">
              <Link href="/account">Account</Link>
              <UserButton />
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button variant="secondary" className={styles.navButton}>
                  <KeyIcon className={styles.signInIcon} />
                  <span className={styles.signInLabel}>Sign in</span>
                </Button>
              </SignInButton>
            </Show>
            <SchemeToggle />
            <ThemeSwitcher />
          </div>
        </nav>
      </div>
    </header>
  );
}
