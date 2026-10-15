"use client";

import { Button, Spinner } from "@heroui/react";
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
      setError("Couldn't open the billing portal. Try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        isPending={loading}
        onPress={go}
        className="mt-5"
      >
        {({ isPending }) => (
          <>
            {isPending ? <Spinner color="current" size="sm" /> : null}
            {isPending ? "Opening" : "Manage billing"}
          </>
        )}
      </Button>
      {error ? <p className="mt-2 text-xs text-warn">{error}</p> : null}
    </>
  );
}
