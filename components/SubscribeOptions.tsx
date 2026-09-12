"use client";

import { useState } from "react";
import { Show, SignInButton } from "@clerk/nextjs";
import { SUBSCRIPTION, type PurchasablePlan } from "@/lib/config";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import styles from "./SubscribeOptions.module.css";

/**
 * The free tier isn't bought — signing in subscribes you to the $0 plan
 * automatically — so this card only ever points at sign-in.
 */
function FreeCard() {
  const info = SUBSCRIPTION.free;
  return (
    <div className={styles.priceCard}>
      <div className={styles.amount}>${info.amount}</div>
      <p className="meta">forever</p>
      <p>Read everything marked free. No card required.</p>
      <Show when="signed-in">
        <Button block disabled>
          Included with your account
        </Button>
      </Show>
      <Show when="signed-out">
        <SignInButton mode="modal" forceRedirectUrl="/subscribe">
          <Button block variant="secondary">
            Sign in to start free
          </Button>
        </SignInButton>
      </Show>
    </div>
  );
}

function PlanCard({
  plan,
  onSelect,
  loading,
}: {
  plan: PurchasablePlan;
  onSelect: (p: PurchasablePlan) => void;
  loading: PurchasablePlan | null;
}) {
  const info = SUBSCRIPTION[plan];
  return (
    <div className={styles.priceCard}>
      <div className={styles.amount}>${info.amount}</div>
      <p className="meta">per {info.interval}</p>
      <p>
        {plan === "annual"
          ? "Best value — two months free vs monthly."
          : "Access to all content. Cancel anytime."}
      </p>
      <Show when="signed-in">
        <Button
          block
          disabled={loading !== null}
          onClick={() => onSelect(plan)}
        >
          {loading === plan ? <Spinner /> : `Choose ${plan}`}
        </Button>
      </Show>
      <Show when="signed-out">
        <SignInButton mode="modal" forceRedirectUrl="/subscribe">
          <Button block>Sign in to subscribe</Button>
        </SignInButton>
      </Show>
    </div>
  );
}

export function SubscribeOptions() {
  const [loading, setLoading] = useState<PurchasablePlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function select(plan: PurchasablePlan) {
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Could not start checkout.");
        setLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(null);
    }
  }

  return (
    <>
      {error ? <p className="warn">{error}</p> : null}
      <div className={styles.pricing}>
        <FreeCard />
        <PlanCard plan="monthly" onSelect={select} loading={loading} />
        <PlanCard plan="annual" onSelect={select} loading={loading} />
      </div>
    </>
  );
}
