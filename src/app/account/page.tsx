import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Mark } from "@/components/brand";
import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Account",
};

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountShellFallback />}>
      <AccountContent />
    </Suspense>
  );
}

function AccountShellFallback() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 md:py-20">
      <div className="h-10 w-40 animate-pulse rounded-lg bg-surface-secondary" />
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl border border-separator bg-surface" />
        <div className="h-64 animate-pulse rounded-2xl border border-separator bg-surface" />
      </div>
    </main>
  );
}

async function AccountContent() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/auth/sign-in");
  }

  const { user } = session;

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 md:py-20">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Account
      </h1>
      <p className="mt-2 text-muted">Signed in as {user.email}</p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-separator bg-surface p-6">
          <h2 className="font-display text-lg font-semibold">Profile</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted">Name</dt>
              <dd className="mt-0.5 text-foreground">{user.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Email</dt>
              <dd className="mt-0.5 text-foreground">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted">Member since</dt>
              <dd className="mt-0.5 text-foreground">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </div>
          </dl>
          <div className="mt-6">
            <SignOutButton />
          </div>
        </section>

        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-separator bg-surface p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Plan</h2>
              <span className="rounded-full border border-separator bg-surface-secondary px-2.5 py-1 text-xs text-muted">
                Free
              </span>
            </div>
            <p className="mt-3 text-sm text-muted">
              Everything self-hostable plus the hosted control plane. Cloud
              anchor plans land here when they launch — see{" "}
              <a href="/pricing" className="text-foreground underline underline-offset-4">
                pricing
              </a>
              .
            </p>
          </section>

          <section className="rounded-2xl border border-dashed border-separator bg-surface/50 p-6">
            <div className="flex items-center gap-3">
              <Mark className="h-8 w-8" title="Varde" />
              <h2 className="font-display text-lg font-semibold">
                Link your Varde account
              </h2>
            </div>
            <p className="mt-3 text-sm text-muted">
              Your in-game Varde account lives in the control plane today. Once
              accounts unify, you&apos;ll link it here to manage groups, anchors
              and billing from varde.games.
            </p>
            <button
              type="button"
              disabled
              className="mt-5 cursor-not-allowed rounded-lg border border-separator bg-surface-secondary px-4 py-2 text-sm font-semibold text-muted"
            >
              Coming soon
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
