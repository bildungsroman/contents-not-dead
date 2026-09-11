import Link from "next/link";
import { PER_CONTENT_PRICE_USD } from "@/lib/config";
import { ButtonLink } from "./Button";
import { Panel } from "./Panel";

/** Shown to unauthenticated/unsubscribed humans on a paid post. */
export function Paywall({
  postId,
  postTitle,
}: {
  postId: string;
  postTitle: string;
}) {
  return (
    <Panel>
      <h2 style={{ marginTop: 0 }}>This content is for subscribers</h2>
      <p>
        <strong>{postTitle}</strong> is available with a Content&rsquo;s Not
        Dead subscription — $5/month or $50/year for unlimited access to
        everything.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <ButtonLink href="/subscribe">Subscribe for unlimited access</ButtonLink>
        <ButtonLink variant="secondary" href="/account">
          Manage subscription
        </ButtonLink>
      </div>
      <hr style={{ margin: "24px 0", borderColor: "var(--border)" }} />
      <h3>Are you an agent?</h3>
      <p>
        You can pay <strong>${PER_CONTENT_PRICE_USD}</strong> for just this item
        over the Machine Payments Protocol (MPP). Request the resource and
        you&rsquo;ll receive an HTTP <code>402</code> challenge:
      </p>
      <pre>
        <code>GET /api/content/{postId}</code>
      </pre>
      <p>
        See <Link href="/payments">/payments</Link> for the full agent guide, or{" "}
        <a href="/.well-known/mpp.json">/.well-known/mpp.json</a> for
        machine-readable details.
      </p>
    </Panel>
  );
}
