"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Spinner } from "./Spinner";

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
      <Button disabled={loading} onClick={openPortal}>
        {loading ? <Spinner /> : "Manage / cancel subscription"}
      </Button>
    </>
  );
}
