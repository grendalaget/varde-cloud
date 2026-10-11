import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/lib/auth";
import { federationSecret, mintDesktopToken } from "@/lib/federation";

import { DesktopHandoff } from "./desktop-handoff";

export const metadata: Metadata = {
  title: "Sign in to the Varde app",
};

// "Log in with Varde" on the desktop app lands here: a session is required
// (bounce through sign-in and back), then a short-lived federation token is
// minted and handed to the app via the varde:// protocol.
export default function DesktopAuthPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
          <div className="h-48 w-full max-w-sm animate-pulse rounded-2xl border border-separator bg-surface" />
        </main>
      }
    >
      <DesktopAuthContent />
    </Suspense>
  );
}

async function DesktopAuthContent() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/auth/sign-in?next=/auth/desktop");
  }
  const secret = federationSecret();
  const token = secret
    ? await mintDesktopToken(session.user, secret)
    : null;
  return <DesktopHandoff callbackUrl={token ? `varde://auth/callback?token=${token}` : null} />;
}
