import Link from "next/link";
import { Mark } from "@/components/brand";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <Mark className="h-20 w-20" title="Varde" />
      <h1 className="mt-8 font-display text-4xl font-bold tracking-tight">
        This stone isn&apos;t here.
      </h1>
      <p className="mt-3 text-muted">
        The page you&apos;re looking for moved or never existed.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-glod px-5 py-3 text-sm font-semibold text-natt transition-colors hover:bg-[#ff6f3d]"
      >
        Back to varde.games
      </Link>
    </main>
  );
}
