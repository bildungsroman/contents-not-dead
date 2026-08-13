import Link from "next/link";
import { SITE } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <p className="footer-lead">{SITE.description}</p>
        <div className="footer-groups">
          <div className="footer-group">
            <p className="footer-group-title">Humans</p>
            <Link href="/subscribe">Subscribe</Link>
            <Link href="/account">Account</Link>
          </div>
          <div className="footer-group">
            <p className="footer-group-title">Agents</p>
            <Link href="/payments">MPP payments</Link>
            <a href="/llms.txt">llms.txt</a>
            <a href="/.well-known/mpp.json">.well-known/mpp.json</a>
            <Link href="/agents">/agents</Link>
          </div>
          <div className="footer-group">
            <p className="footer-group-title">Project</p>
            <Link href="/docs">Docs</Link>
            <a href={SITE.repo}>Source</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
