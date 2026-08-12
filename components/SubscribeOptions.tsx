"use client";

import { useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { SUBSCRIPTION } from "@/lib/config";

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
    <div className="price-card">
      <div className="amount">${info.amount}</div>
      <p className="meta">per {info.interval}</p>
      <p>
        {plan === "annual"
          ? "Best value — two months free vs monthly."
          : "Cancel anytime."}
      </p>
      <SignedIn>
        <button
          className="btn block"
          disabled={loading !== null}
          onClick={() => onSelect(plan)}
        >
          {loading === plan ? <span className="spinner" /> : `Choose ${plan}`}
        </button>
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal" forceRedirectUrl="/subscribe">
          <button className="btn block">Sign in to subscribe</button>
        </SignInButton>
      </SignedOut>
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
      <div className="pricing">
        <PlanCard plan="monthly" onSelect={select} loading={loading} />
        <PlanCard plan="annual" onSelect={select} loading={loading} />
      </div>
    </>
  );
}
