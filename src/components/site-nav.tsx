"use client";

import { Navbar } from "@heroui-pro/react/navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Logo } from "./brand";
import { NavAuthItems, NavAuthMenuItems } from "./nav-auth";

export const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#games", label: "Games" },
  { href: "/pricing", label: "Pricing" },
  { href: "/download", label: "Download" },
  { href: "/docs", label: "Docs" },
];

// The auth zone is client-side (nav-auth.tsx): better-auth's client store
// persists across soft navigations, so the avatar/sign-in state renders
// instantly on every nav. The `navigate` prop is what makes Navbar.Item
// soft-navigate — without it every nav click is a full document reload
// (React Aria RouterProvider is NOT what Navbar items read).
export function SiteNav() {
  const router = useRouter();

  return (
    <Navbar
      navigate={(href) => router.push(href)}
      className="border-b border-separator bg-natt/80 backdrop-blur-md"
    >
      <Navbar.Header>
        <Navbar.Brand>
          <Link href="/" aria-label="Varde home" className="shrink-0">
            <Logo />
          </Link>
        </Navbar.Brand>

        <Navbar.Content className="hidden md:flex">
          {NAV_LINKS.map((link) => (
            <Navbar.Item
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Navbar.Item>
          ))}
          <Navbar.Item
            href="https://github.com/grendalaget/varde"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            GitHub
          </Navbar.Item>
        </Navbar.Content>

        <Navbar.Spacer />

        <Navbar.Content className="hidden sm:flex">
          <NavAuthItems />
        </Navbar.Content>

        <Navbar.MenuToggle className="md:hidden" />

        <Navbar.Menu>
          {NAV_LINKS.map((link) => (
            <Navbar.MenuItem key={link.href} href={link.href}>
              {link.label}
            </Navbar.MenuItem>
          ))}
          <Navbar.MenuItem
            href="https://github.com/grendalaget/varde"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </Navbar.MenuItem>
          <NavAuthMenuItems />
        </Navbar.Menu>
      </Navbar.Header>
    </Navbar>
  );
}
