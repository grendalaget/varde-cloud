"use client";

import { Navbar } from "@heroui-pro/react/navbar";

import { useEffect } from "react";

import { LinkButton } from "./link-button";

import { useSession } from "@/lib/auth-client";

import {
  NavSignOutMenuItem,
  NavUserMenu,
  type NavUser,
} from "./nav-user-menu";

function SignInItems() {
  return (
    <>
      <Navbar.Item
        href="/auth/sign-in"
        className="text-sm text-muted transition-colors hover:text-foreground"
      >
        Sign in
      </Navbar.Item>
      <LinkButton href="/download" size="sm">
        Get started
      </LinkButton>
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

// The session lives in better-auth's client store — a stream-free client
// subtree never blinks on soft navs the way a Suspense-streamed server
// subtree does. One wrinkle: better-auth's useSession reads the atom via
// useSyncExternalStore with getServerSnapshot = store.init, so whenever
// React re-hydrates this subtree at a route commit it briefly reports
// {data:null, isPending:true} before the live snapshot lands. The last
// resolved user is latched at module scope so the pending box can only
// ever render before the FIRST session fetch; a resolved no-session state
// (real sign-out) still clears it.
const sessionCache: { user: NavUser | null } = { user: null };

function useNavUser() {
  const { data: session, isPending } = useSession();
  useEffect(() => {
    if (session) sessionCache.user = session.user;
    else if (!isPending) sessionCache.user = null;
  }, [session, isPending]);
  // The cache only fills the {data:null, isPending:true} commit transient —
  // once the store resolves to no-session, signed-out renders regardless.
  return {
    user: session?.user ?? (isPending ? sessionCache.user : null),
    isPending,
  };
}

export function NavAuthItems() {
  const { user, isPending } = useNavUser();
  if (!user) {
    return isPending ? (
      <div className="size-7" aria-hidden="true" />
    ) : (
      <SignInItems />
    );
  }
  return <NavUserMenu user={user} />;
}

export function NavAuthMenuItems() {
  const { user, isPending } = useNavUser();
  if (!user) {
    return isPending ? null : <SignInMenuItems />;
  }
  return (
    <>
      <Navbar.MenuItem href="/account">
        <span className="flex flex-col">
          <span>Account</span>
          <span className="text-xs text-muted">{user.email}</span>
        </span>
      </Navbar.MenuItem>
      <NavSignOutMenuItem />
    </>
  );
}
