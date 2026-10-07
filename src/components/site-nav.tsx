import { Link as HLink } from "@heroui/react";
import Link from "next/link";
import { Logo } from "./brand";
import { MobileNav } from "./mobile-nav";

export const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#games", label: "Games" },
  { href: "/pricing", label: "Pricing" },
  { href: "/download", label: "Download" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-separator bg-natt/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Varde home" className="shrink-0">
          <Logo />
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <HLink
            href="https://github.com/grendalaget/varde"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            GitHub
          </HLink>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/auth/sign-in"
            className="hidden rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/download"
            className="hidden rounded-md bg-glod px-3.5 py-1.5 text-sm font-semibold text-natt transition-colors hover:bg-[#ff6f3d] sm:block"
          >
            Get started
          </Link>
          <MobileNav />
        </div>
      </nav>
    </header>
  );
}
