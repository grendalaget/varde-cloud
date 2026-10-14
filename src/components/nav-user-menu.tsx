"use client";

import {
  Button,
  Description,
  Dropdown,
  Header,
  Label,
  Separator,
} from "@heroui/react";
import { Navbar, useNavbar } from "@heroui-pro/react/navbar";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export type NavUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function initialsFor(user: NavUser) {
  const source = (user.name ?? "").trim() || (user.email ?? "");
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function NavUserMenu({ user }: { user: NavUser }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Dropdown>
      <Button
        isIconOnly
        variant="ghost"
        aria-label="Account menu"
        className="rounded-full"
      >
        {/* Plain img, not Radix Avatar — it remounts on soft navigations and
            re-checks load state, flashing the fallback for a frame or two. */}
        <span className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-secondary text-[10px] font-semibold">
          {initialsFor(user)}
          {user.image && !imageFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              onError={() => setImageFailed(true)}
              className="absolute inset-0 size-full object-cover"
            />
          ) : null}
        </span>
      </Button>
      <Dropdown.Popover className="min-w-[220px]" placement="bottom end">
        <Dropdown.Menu
          disabledKeys={signingOut ? ["sign-out"] : []}
          onAction={async (key) => {
            if (key === "account") {
              router.push("/account");
            }
            if (key === "sign-out") {
              setSigningOut(true);
              try {
                const res = await authClient.signOut();
                if (res?.error) throw res.error;
              } catch {
                setSigningOut(false);
                return;
              }
              router.push("/");
              router.refresh();
            }
          }}
        >
          <Dropdown.Section>
            <Header>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">
                  {user.name || "Account"}
                </span>
                {user.email ? (
                  <Description>{user.email}</Description>
                ) : null}
              </span>
            </Header>
            <Dropdown.Item id="account" textValue="Account">
              <Label>Account</Label>
            </Dropdown.Item>
          </Dropdown.Section>
          <Separator />
          <Dropdown.Item
            id="sign-out"
            textValue="Sign out"
            variant="danger"
            isDisabled={signingOut}
          >
            <Label>{signingOut ? "Signing out…" : "Sign out"}</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export function NavSignOutMenuItem() {
  const router = useRouter();
  const { setMenuOpen } = useNavbar();
  const [signingOut, setSigningOut] = useState(false);

  return (
    <Navbar.MenuItem
      onClick={async () => {
        if (signingOut) return;
        setSigningOut(true);
        try {
          const res = await authClient.signOut();
          if (res?.error) throw res.error;
        } catch {
          // Keep the menu open so Sign out is retryable.
          setSigningOut(false);
          return;
        }
        setMenuOpen(false);
        router.push("/");
        router.refresh();
      }}
    >
      {signingOut ? "Signing out…" : "Sign out"}
    </Navbar.MenuItem>
  );
}
