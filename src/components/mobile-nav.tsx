"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { useState } from "react";
import { NAV_LINKS } from "./site-nav";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        isIconOnly
        variant="tertiary"
        size="sm"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onPress={() => setOpen((v) => !v)}
      >
        {open ? (
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
          </svg>
        )}
      </Button>
      {open ? (
        <div className="absolute inset-x-0 top-16 border-b border-separator bg-natt px-4 py-3 shadow-xl">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-surface-secondary"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://github.com/grendalaget/varde"
              target="_blank"
              rel="noreferrer"
              className="rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-surface-secondary"
            >
              GitHub
            </a>
            <Link
              href="/auth/sign-in"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-secondary"
            >
              Sign in
            </Link>
            <Link
              href="/download"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-md bg-glod px-3 py-2.5 text-center text-sm font-semibold text-natt"
            >
              Get started
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
