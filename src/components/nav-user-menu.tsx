"use client";

import {
  Avatar,
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

  return (
    <Dropdown>
      <Button
        isIconOnly
        variant="ghost"
        aria-label="Account menu"
        className="rounded-full"
      >
        <Avatar className="size-7">
          {user.image ? <Avatar.Image src={user.image} alt="" /> : null}
          <Avatar.Fallback>{initialsFor(user)}</Avatar.Fallback>
        </Avatar>
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
              await authClient.signOut();
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
        setMenuOpen(false);
        await authClient.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      {signingOut ? "Signing out…" : "Sign out"}
    </Navbar.MenuItem>
  );
}
