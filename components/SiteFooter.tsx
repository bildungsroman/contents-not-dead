import Link from "next/link";
import { SITE } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <p>
          {SITE.name} — open source. Humans{" "}
          <Link href="/subscribe">subscribe</Link>; agents{" "}
          <Link href="/payments">pay per item via MPP</Link>.{" "}
          <a href="/llms.txt">llms.txt</a> ·{" "}
          <a href="/.well-known/mpp.json">.well-known/mpp.json</a> ·{" "}
          <Link href="/agents">/agents</Link> ·{" "}
          <a href={SITE.repo}>source</a>
        </p>
      </div>
    </footer>
  );
}
