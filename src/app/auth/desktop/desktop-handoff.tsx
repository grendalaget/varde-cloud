"use client";

import { Button, Card } from "@heroui/react";
import Link from "next/link";
import { useEffect } from "react";

// Navigates to the varde:// callback (the browser asks to open the app) and
// renders the same link as a manual fallback.
export function DesktopHandoff({ callbackUrl }: { callbackUrl: string | null }) {
  useEffect(() => {
    if (callbackUrl) window.location.href = callbackUrl;
  }, [callbackUrl]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <Card className="vd-pop w-full max-w-sm rounded-2xl border border-separator bg-surface p-7">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Back to the Varde app
        </h1>
        {callbackUrl ? (
          <>
            <p className="mt-1.5 text-sm text-muted">
              You are signed in — your browser should ask to open Varde. If
              nothing happens, use the button below. The link works once and
              expires in five minutes.
            </p>
            <Button
              fullWidth
              className="mt-6"
              onPress={() => {
                window.location.href = callbackUrl;
              }}
            >
              Open Varde
            </Button>
            <p className="mt-6 text-center text-sm text-muted">
              No Varde app yet?{" "}
              <Link
                href="/download"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Get Varde
              </Link>
            </p>
          </>
        ) : (
          <p className="mt-1.5 text-sm text-muted">
            Desktop sign-in is not configured on this deployment right now.
            Sign in on this device with your Varde code instead.
          </p>
        )}
      </Card>
    </main>
  );
}
