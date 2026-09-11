import Link from "next/link";
import { SITE } from "@/lib/config";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <p className={styles.footerLead}>{SITE.description}</p>
        <div className={styles.footerGroups}>
          <div className={styles.footerGroup}>
            <p className={styles.footerGroupTitle}>Humans</p>
            <Link href="/subscribe">Subscribe</Link>
            <Link href="/account">Account</Link>
          </div>
          <div className={styles.footerGroup}>
            <p className={styles.footerGroupTitle}>Agents</p>
            <Link href="/payments">MPP payments</Link>
            <a href="/llms.txt">llms.txt</a>
            <a href="/.well-known/mpp.json">.well-known/mpp.json</a>
            <Link href="/agents">/agents</Link>
          </div>
          <div className={styles.footerGroup}>
            <p className={styles.footerGroupTitle}>Project</p>
            <Link href="/docs">Docs</Link>
            <a href={SITE.repo}>Source</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
