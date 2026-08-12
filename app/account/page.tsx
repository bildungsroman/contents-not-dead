import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import { getSubscriptionState, isActive } from "@/lib/subscription";
import { ManageSubscription } from "@/components/ManageSubscription";

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
        <div className="panel prose">
          <h1 style={{ marginTop: 0 }}>Your account</h1>
          <p>Sign in to view your subscription and manage billing.</p>
          <SignInButton mode="modal" forceRedirectUrl="/account">
            <button className="btn">Sign in</button>
          </SignInButton>
        </div>
      </main>
    );
  }

  const { state } = await getSubscriptionState();
  const active = isActive(state);
  const renews = formatDate(state.currentPeriodEnd);

  return (
    <main className="container">
      <div className="prose">
        <h1>Your account</h1>
      </div>

      <div className="panel prose" style={{ marginTop: 12 }}>
        {active ? (
          <>
            <h2 style={{ marginTop: 0 }}>Subscription active</h2>
            <p>
              Plan: <strong>{state.plan ?? "subscription"}</strong>
              {state.status === "trialing" ? " (trial)" : ""}.
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
            <h2 style={{ marginTop: 0 }}>No active subscription</h2>
            <p>
              You don&rsquo;t have an active subscription. Subscribe for
              unlimited access to all content.
            </p>
            <Link className="btn" href="/subscribe">
              See plans
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
