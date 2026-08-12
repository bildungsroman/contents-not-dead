"use client";

import { useState } from "react";

export function ManageSubscription() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Could not open the billing portal.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      {error ? <p className="warn">{error}</p> : null}
      <button className="btn" disabled={loading} onClick={openPortal}>
        {loading ? <span className="spinner" /> : "Manage / cancel subscription"}
      </button>
    </>
  );
}
