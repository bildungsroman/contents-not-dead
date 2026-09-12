import type { Metadata } from "next";
import Link from "next/link";
import { getSubscriptionState, isActive, isPaidPlan } from "@/lib/subscription";
import { SubscribeOptions } from "@/components/SubscribeOptions";
import { Panel } from "@/components/Panel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Subscribe" };

export default async function SubscribePage() {
  const { state } = await getSubscriptionState();
  // Every signed-in user has an active $0 subscription, so "already subscribed"
  // has to mean a paid plan — otherwise free users could never upgrade.
  const subscribed = isActive(state) && isPaidPlan(state.plan);

  return (
    <main className="container">
      <div className="prose">
        <h1>Subscribe</h1>
        <p>
          Sign up to access to articles and images on Content&rsquo;s Not Dead. Pick a
          plan below. Prefer to pay per item? Agents can do that over{" "}
          <Link href="/payments">MPP</Link>.
        </p>
      </div>

      {subscribed ? (
        <Panel style={{ marginTop: 20 }}>
          <h2 style={{ marginTop: 0 }}>You&rsquo;re subscribed</h2>
          <p>
            Your {state.plan ?? ""} subscription is active. Manage it from your{" "}
            <Link href="/account">account</Link>.
          </p>
        </Panel>
      ) : (
        <SubscribeOptions />
      )}
    </main>
  );
}
