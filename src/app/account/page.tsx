import { Alert, Card, Chip, Link } from "@heroui/react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { HostingDashboard } from "@/components/hosting-dashboard";
import { PortalButton } from "@/components/portal-button";
import { Item, Reveal, Stagger } from "@/components/reveal";
import { SignOutButton } from "@/components/sign-out-button";
import { BILLING_ENABLED } from "@/lib/polar";
import { getServerSession } from "@/lib/session";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  anchor: "Anchor",
  "anchor+": "Anchor+",
};

export const metadata: Metadata = {
  title: "Account",
};

export default function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<AccountShellFallback />}>
      <AccountContent searchParams={searchParams} />
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

async function AccountContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  const { user } = session;
  const justVerified = (await searchParams).verified === "1";

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 md:py-20">
      <Reveal>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Account
        </h1>
        <p className="mt-2 text-muted">Signed in as {user.email}</p>
      </Reveal>

      {justVerified ? (
        <Alert status="success" className="mt-6">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>
              Email verified. Your account is all set.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <Stagger stagger={0.08} className="mt-10 grid gap-5 md:grid-cols-2">
        <Item>
          <Card className="h-full rounded-2xl border border-separator bg-surface p-6">
            <h2 className="font-display text-lg font-semibold">Profile</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-muted">Name</dt>
                <dd className="mt-0.5 text-foreground">{user.name || "Not set"}</dd>
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
          </Card>
        </Item>
        <Item className="flex flex-col gap-5">
          <Card className="rounded-2xl border border-separator bg-surface p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Plan</h2>
              <Chip variant="secondary" size="sm">
                {PLAN_LABELS[user.plan as string] ?? "Free"}
              </Chip>
            </div>
            <p className="mt-3 text-sm text-muted">
              {user.plan === "free"
                ? "Everything self-hostable plus the hosted control plane. "
                : "Managed cloud anchor for your group. "}
              See{" "}
              <Link href="/pricing">pricing</Link>.
            </p>
            {BILLING_ENABLED ? <PortalButton /> : null}
          </Card>

        </Item>
        <Item className="md:col-span-2">
          <HostingDashboard />
        </Item>
      </Stagger>
    </main>
  );
}
