import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import { getSubscriptionState, isActive, isPaidPlan } from "@/lib/subscription";
import { ManageSubscription } from "@/components/ManageSubscription";
import { Button, ButtonLink } from "@/components/Button";
import { Panel } from "@/components/Panel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account" };

function formatDate(unix?: number) {
  if (!unix) return null;
  return new Date(unix * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function AccountPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <main className="container">
        <Panel>
          <h1 style={{ marginTop: 0 }}>Your account</h1>
          <p>Sign in to view your subscription and manage billing.</p>
          <SignInButton mode="modal" forceRedirectUrl="/account">
            <Button>Sign in</Button>
          </SignInButton>
        </Panel>
      </main>
    );
  }

  const { state } = await getSubscriptionState();
  // The free tier is a real active $0 subscription, so "subscribed" means a
  // paid plan. Only paid customers have anything to manage in the portal.
  const paid = isActive(state) && isPaidPlan(state.plan);
  const renews = formatDate(state.currentPeriodEnd);

  return (
    <main className="container">
      <div className="prose">
        <h1>Your account</h1>
      </div>

      <Panel style={{ marginTop: 12 }}>
        {paid ? (
          <>
            <h2 style={{ marginTop: 0 }}>Unlimited — subscription active</h2>
            <p>
              Plan: <strong>{state.plan ?? "subscription"}</strong>
              {state.status === "trialing" ? " (trial)" : ""}. You can read
              everything on the site.
              {renews ? (
                <>
                  {" "}
                  {state.status === "canceled"
                    ? "Access ends"
                    : "Renews"}{" "}
                  on <strong>{renews}</strong>.
                </>
              ) : null}
            </p>
            <ManageSubscription />
          </>
        ) : (
          <>
            <h2 style={{ marginTop: 0 }}>Free tier</h2>
            <p>
              You can read everything marked <strong>Free</strong>. Subscribe
              for unlimited access to members-only content.
            </p>
            <ButtonLink href="/subscribe">See plans</ButtonLink>
          </>
        )}
      </Panel>
    </main>
  );
}
