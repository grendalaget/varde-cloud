"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth-client";

/** "Manage billing" → Polar customer portal (billing enabled only). */
export function PortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    const { error } = await authClient.customer.portal();
    if (error) {
      setError("Couldn't open the billing portal — try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className="mt-5 rounded-lg border border-separator bg-surface-secondary px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-tertiary disabled:opacity-60"
      >
        {loading ? "Opening…" : "Manage billing"}
      </button>
      {error ? <p className="mt-2 text-xs text-warn">{error}</p> : null}
    </>
  );
}
