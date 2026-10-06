import Link from "next/link";
import { SITE } from "@/lib/config";
import { viewHref } from "@/lib/view";
import { ExternalLink } from "./ExternalLink";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <p className={styles.footerLead}>{SITE.description}</p>
        <div className={styles.footerGroups}>
          <div className={styles.footerGroup}>
            <p className={styles.footerGroupTitle}>Humans</p>
            <Link href="/about">About</Link>
            <Link href="/subscribe">Subscribe</Link>
            <Link href="/account">Account</Link>
          </div>
          <div className={styles.footerGroup}>
            <p className={styles.footerGroupTitle}>Agents</p>
            <Link href={viewHref("agent")}>MPP payments</Link>
            <a href="/llms.txt">llms.txt</a>
            <a href="/.well-known/mpp.json">.well-known/mpp.json</a>
            <Link href="/agents">/agents</Link>
          </div>
          <div className={styles.footerGroup}>
            <p className={styles.footerGroupTitle}>Project</p>
            <Link href="/docs">Docs</Link>
            <ExternalLink href={SITE.repo}>Source</ExternalLink>
          </div>
          <div className={styles.footerGroup}>
            <p className={styles.footerGroupTitle}>Built with</p>
            <ExternalLink href="https://stripe.com">Stripe</ExternalLink>
            <ExternalLink href="https://tempo.xyz">Tempo</ExternalLink>
            <ExternalLink href="https://mpp.dev">
              Machine Payments Protocol
            </ExternalLink>
          </div>
        </div>
        <p className={styles.copyright}>
          ©{new Date().getFullYear()} Stripe | Site design by{" "}
          <ExternalLink href="https://larissawaterman.com">
            Larissa Waterman
          </ExternalLink>
        </p>
      </div>
    </footer>
  );
}
