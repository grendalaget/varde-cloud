import type { Metadata } from "next";

import { LinkButton } from "@/components/link-button";

export const metadata: Metadata = {
  title: "Thank you",
  description: "Thank you for supporting Varde.",
  robots: { index: false },
};

export default function Thanks() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6 md:py-32">
      <svg
        viewBox="0 0 24 24"
        className="h-10 w-10 text-glod"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Thank you.
      </h1>
      <p className="mt-4 max-w-md text-muted">
        Your donation goes straight to Varde&apos;s development — the
        open-source, peer-hosted game server platform. It means a lot.
      </p>
      <div className="mt-8">
        <LinkButton href="/" variant="secondary">
          Back to varde.games
        </LinkButton>
      </div>
    </main>
  );
}
