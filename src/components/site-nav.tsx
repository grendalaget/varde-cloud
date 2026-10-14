import { Navbar } from "@heroui-pro/react/navbar";
import Link from "next/link";
import { Suspense } from "react";

import { getServerSession } from "@/lib/session";

import { Logo } from "./brand";
import { NavSignOutMenuItem, NavUserMenu } from "./nav-user-menu";

export const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#games", label: "Games" },
  { href: "/pricing", label: "Pricing" },
  { href: "/download", label: "Download" },
  { href: "/docs", label: "Docs" },
];

function SignInItems() {
  return (
    <>
      <Navbar.Item
        href="/auth/sign-in"
        className="text-sm text-muted transition-colors hover:text-foreground"
      >
        Sign in
      </Navbar.Item>
      <Navbar.Item
        href="/download"
        className="rounded-md bg-glod px-3.5 py-1.5 text-sm font-semibold text-natt transition-all duration-200 ease-vd-out hover:bg-[#ff6f3d] active:scale-[0.96]"
      >
        Get started
      </Navbar.Item>
    </>
  );
}

function SignInMenuItems() {
  return (
    <>
      <Navbar.MenuItem href="/auth/sign-in">Sign in</Navbar.MenuItem>
      <Navbar.MenuItem href="/download">Get started</Navbar.MenuItem>
    </>
  );
}

async function NavAuthItems() {
  const session = await getServerSession();
  if (!session) {
    return <SignInItems />;
  }

  const { name, email, image } = session.user;
  return <NavUserMenu user={{ name, email, image }} />;
}

async function NavAuthMenuItems() {
  const session = await getServerSession();
  if (!session) {
    return <SignInMenuItems />;
  }

  return (
    <>
      <Navbar.MenuItem href="/account">
        <span className="flex flex-col">
          <span>Account</span>
          <span className="text-xs text-muted">{session.user.email}</span>
        </span>
      </Navbar.MenuItem>
      <NavSignOutMenuItem />
    </>
  );
}

// The fallback must never render signed-out controls for a possibly-signed-in
// user — a neutral reserved box (avatar footprint) swaps into either state
// without flashing the wrong one.
function AuthItemsFallback() {
  return <div className="size-7" aria-hidden="true" />;
}

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
          <Suspense fallback={<AuthItemsFallback />}>
            <NavAuthItems />
          </Suspense>
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
          <Suspense fallback={null}>
            <NavAuthMenuItems />
          </Suspense>
        </Navbar.Menu>
      </Navbar.Header>
    </Navbar>
  );
}
