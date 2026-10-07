"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

/**
 * Polar checkout button. Renders a disabled "Coming soon" state until
 * billing is enabled (POLAR_ACCESS_TOKEN + product IDs on the server).
 * Signed-out users go to sign-in first (checkout requires auth).
 */
export function CheckoutButton({
  slug,
  billingEnabled,
  label,
  variant = "primary",
  className = "",
}: {
  slug: string;
  billingEnabled: boolean;
  label: string;
  variant?: "primary" | "secondary" | "link";
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = authClient.useSession();

  const base =
    variant === "link"
      ? "text-sm text-muted underline-offset-4 transition-colors hover:text-foreground"
      : variant === "primary"
        ? "rounded-lg bg-glod px-4 py-2.5 text-sm font-semibold text-natt transition-colors hover:bg-[#ff6f3d]"
        : "rounded-lg border border-separator bg-surface-secondary px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-tertiary";

  if (!billingEnabled) {
    return (
      <button
        type="button"
        disabled
        className="mt-8 w-full cursor-not-allowed rounded-lg border border-separator bg-surface-secondary px-4 py-2.5 text-sm font-semibold text-muted"
      >
        Coming soon
      </button>
    );
  }

  async function go() {
    setLoading(true);
    setError(null);
    if (!session) {
      router.push("/auth/sign-in?next=/pricing");
      return;
    }
    const { error } = await authClient.checkout({ slug });
    if (error) {
      setError("Checkout failed to start — try again.");
      setLoading(false);
    }
    // on success better-auth redirects to the Polar checkout URL
  }

  return (
    <>
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className={`w-full ${base} ${loading ? "opacity-60" : ""} ${className}`}
      >
        {loading ? "Opening checkout…" : label}
      </button>
      {error ? <p className="mt-2 text-xs text-warn">{error}</p> : null}
    </>
  );
}
