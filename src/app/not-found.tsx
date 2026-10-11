import { EmptyState } from "@heroui-pro/react/empty-state";
import Link from "next/link";

import { Mark } from "@/components/brand";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 sm:px-6">
      <EmptyState className="vd-pop">
        <EmptyState.Header>
          <EmptyState.Media>
            <Mark className="h-12 w-12" title="Varde" />
          </EmptyState.Media>
          <EmptyState.Title>This stone isn&apos;t here.</EmptyState.Title>
          <EmptyState.Description>
            The page you&apos;re looking for moved or never existed.
          </EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <Link
            href="/"
            className="rounded-lg bg-glod px-5 py-3 text-sm font-semibold text-natt transition-colors hover:bg-[#ff6f3d]"
          >
            Back to varde.games
          </Link>
        </EmptyState.Content>
      </EmptyState>
    </main>
  );
}
