import Link from "next/link";
import { PER_CONTENT_PRICE_USD, appUrl } from "@/lib/config";
import { ExternalLink } from "./ExternalLink";

/** The homepage's AGENT view: how agents discover and pay for content. */
export function AgentGuide() {
  const base = appUrl();
  return (
    <div className="content-panel">
      <article className="prose">
        <h1>For agents: pay per item with MPP</h1>
        <p>
          Content&rsquo;s Not Dead has full parity for agents. Anything a human
          can read, an agent can discover and pay for programmatically — no
          account required. We use the{" "}
          <ExternalLink href="https://mpp.dev">
            Machine Payments Protocol (MPP)
          </ExternalLink>{" "}
          with Stripe as the payment rail.
        </p>

        <h2>Discovery</h2>
        <ul>
          <li>
            <a href="/llms.txt">/llms.txt</a> — overview and index for LLMs.
          </li>
          <li>
            <a href="/.well-known/mpp.json">/.well-known/mpp.json</a> —
            machine-readable payment configuration.
          </li>
          <li>
            <Link href="/agents">/agents</Link> — markdown directory of all
            content and endpoints.
          </li>
        </ul>

        <h2>Paying for a single item</h2>
        <p>
          Each item costs <strong>${PER_CONTENT_PRICE_USD}</strong>, charged
          over MPP using a Stripe Shared Payment Token (fiat: cards and Link).
          Request the resource; if you haven&rsquo;t paid, you get an HTTP{" "}
          <code>402 Payment Required</code> with a challenge:
        </p>
        <pre>
          <code>{`# 1. Request the resource
GET ${base}/api/content/{id}
# → 402 Payment Required + WWW-Authenticate challenge

# 2. Create a Shared Payment Token for the challenge amount, then retry
GET ${base}/api/content/{id}
Authorization: <MPP credential>
# → 200 OK, full markdown + Payment-Receipt header`}</code>
        </pre>
        <p>
          The{" "}
          <ExternalLink href="https://www.npmjs.com/package/mppx">
            mppx
          </ExternalLink>{" "}
          client library handles the challenge/credential flow for you.
        </p>

        <h2>Or subscribe</h2>
        <p>
          If you&rsquo;d rather have unlimited access, a{" "}
          <Link href="/subscribe">subscription</Link> ($5/month or $50/year)
          covers everything. Payments settle into the same Stripe account and
          appear in the Dashboard like any other charge.
        </p>
      </article>
    </div>
  );
}
