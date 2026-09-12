import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";
import { PER_CONTENT_PRICE_USD } from "@/lib/config";
import type { ContentTier } from "@/lib/tiers";
import { Button, ButtonLink } from "./Button";
import { Panel } from "./Panel";

/**
 * Shown when the caller lacks the entitlement for a post's tier.
 *
 * A `free` post only needs a signed-in account, so it leads with sign-in; a
 * `paid` post leads with the upgrade. Both offer the per-item MPP route for
 * anyone who wants one article rather than a subscription.
 */
export function Paywall({
  postId,
  postTitle,
  tier,
}: {
  postId: string;
  postTitle: string;
  tier: ContentTier;
}) {
  return (
    <Panel>
      {tier === "free" ? (
        <>
          <h2 style={{ marginTop: 0 }}>This content is free to read</h2>
          <p>
            <strong>{postTitle}</strong> is free — you just need an account.
            Sign up and read it now, no card required.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button>Sign in to read free</Button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <ButtonLink href="/account">Check your account</ButtonLink>
            </Show>
            <ButtonLink variant="secondary" href="/subscribe">
              See plans
            </ButtonLink>
          </div>
        </>
      ) : (
        <>
          <h2 style={{ marginTop: 0 }}>This content is for subscribers</h2>
          <p>
            <strong>{postTitle}</strong> is available with a Content&rsquo;s Not
            Dead subscription — $5/month or $50/year for unlimited access to
            everything.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Show when="signed-out">
              <SignInButton mode="modal" forceRedirectUrl="/subscribe">
                <Button>Sign in to subscribe</Button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <ButtonLink href="/subscribe">
                Subscribe for unlimited access
              </ButtonLink>
            </Show>
            <ButtonLink variant="secondary" href="/account">
              Manage subscription
            </ButtonLink>
          </div>
        </>
      )}
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
