"use client";

import { RouterProvider } from "@heroui/react";
import { useRouter } from "next/navigation";

/**
 * Gives HeroUI Pro nav items client-side routing. Without it, `Navbar.Item`
 * hrefs fall back to plain anchor navigations — a full reload on every click,
 * which re-streams the auth boundary and flashes the signed-out state.
 */
export function NavRouter({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <RouterProvider navigate={(href) => router.push(href)}>
      {children}
    </RouterProvider>
  );
}
