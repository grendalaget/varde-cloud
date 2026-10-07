import { Navbar } from "@heroui-pro/react/navbar";
import Link from "next/link";

import { Logo } from "./brand";

export const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#games", label: "Games" },
  { href: "/pricing", label: "Pricing" },
  { href: "/download", label: "Download" },
];

export function SiteNav() {
  return (
    <Navbar className="border-b border-separator bg-natt/80 backdrop-blur-md">
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
          <Navbar.Item
            href="/auth/sign-in"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Sign in
          </Navbar.Item>
          <Navbar.Item
            href="/download"
            className="rounded-md bg-glod px-3.5 py-1.5 text-sm font-semibold text-natt transition-colors hover:bg-[#ff6f3d]"
          >
            Get started
          </Navbar.Item>
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
          <Navbar.MenuItem href="/auth/sign-in">Sign in</Navbar.MenuItem>
          <Navbar.MenuItem href="/download">Get started</Navbar.MenuItem>
        </Navbar.Menu>
      </Navbar.Header>
    </Navbar>
  );
}
