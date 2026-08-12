import type { Metadata } from "next";
import Link from "next/link";
import { getSubscriptionState, isActive } from "@/lib/subscription";
import { SubscribeOptions } from "@/components/SubscribeOptions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Subscribe" };

export default async function SubscribePage() {
  const { state } = await getSubscriptionState();
  const active = isActive(state);

  return (
    <main className="container">
      <div className="prose">
        <h1>Subscribe</h1>
        <p>
          Unlimited access to everything on Content&rsquo;s Not Dead. Pick a
          plan below. Prefer to pay per item? Agents can do that over{" "}
          <Link href="/payments">MPP</Link>.
        </p>
      </div>

      {active ? (
        <div className="panel prose" style={{ marginTop: 20 }}>
          <h2 style={{ marginTop: 0 }}>You&rsquo;re subscribed</h2>
          <p>
            Your {state.plan ?? ""} subscription is active. Manage it from your{" "}
            <Link href="/account">account</Link>.
          </p>
        </div>
      ) : (
        <SubscribeOptions />
      )}
    </main>
  );
}
