"use client";

import { Button, Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

  if (!billingEnabled) {
    return (
      <Button
        isDisabled
        variant="secondary"
        fullWidth
        className="mt-8 text-muted"
      >
        Coming soon
      </Button>
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
      setError("Checkout failed to start. Try again.");
      setLoading(false);
    }
    // on success better-auth redirects to the Polar checkout URL
  }

  const isLink = variant === "link";

  return (
    <>
      <Button
        onPress={go}
        isPending={loading}
        variant={isLink ? "ghost" : variant === "secondary" ? "secondary" : "primary"}
        size={isLink ? "sm" : "md"}
        fullWidth={!isLink}
        className={className}
      >
        {({ isPending }) => (
          <>
            {isPending ? <Spinner color="current" size="sm" /> : null}
            {isPending && !isLink ? "Opening checkout" : label}
          </>
        )}
      </Button>
      {error ? <p className="mt-2 text-xs text-warn">{error}</p> : null}
    </>
  );
}
