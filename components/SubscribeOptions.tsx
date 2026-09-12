"use client";

import { useState } from "react";
import { Show, SignInButton } from "@clerk/nextjs";
import { SUBSCRIPTION } from "@/lib/config";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import styles from "./SubscribeOptions.module.css";

function PlanCard({
  plan,
  onSelect,
  loading,
}: {
  plan: "monthly" | "annual";
  onSelect: (p: "monthly" | "annual") => void;
  loading: "monthly" | "annual" | null;
}) {
  const info = SUBSCRIPTION[plan];
  return (
    <div className={styles.priceCard}>
      <div className={styles.amount}>${info.amount}</div>
      <p className="meta">per {info.interval}</p>
      <p>
        {plan === "annual"
          ? "Best value — two months free vs monthly."
          : "Cancel anytime."}
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
  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function select(plan: "monthly" | "annual") {
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
        <PlanCard plan="monthly" onSelect={select} loading={loading} />
        <PlanCard plan="annual" onSelect={select} loading={loading} />
      </div>
    </>
  );
}
