"use client";

import { Button, Input, Label, ListBox, Select, TextField } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import { useSession } from "@/lib/auth-client";

// Live-mode plumbing for the docs demos. A signed-in reader's demo talks to
// the hosted control plane through /api/cp/*; everyone else sees the static
// illustration plus a quiet sign-in hint.

export type CpStatus = "loading" | "signed-out" | "unavailable" | "live";

export interface CpGroup {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
}

// One shared snapshot across every demo on the page — a group created in
// one demo is visible in the others, client-side back/forward navigation
// never restores stale groups, and mounts within the TTL share one fetch.
interface CpSnapshot {
  userId: string;
  enabled: boolean;
  groups: CpGroup[];
  at: number;
}

let shared: CpSnapshot | null = null;
let inflight: Promise<unknown> | null = null;
const listeners = new Set<() => void>();
const STATE_TTL_MS = 30_000;

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function fetchState(userId: string): Promise<unknown> {
  if (inflight) return inflight;
  inflight = fetch("/api/cp/state", { cache: "no-store" })
    .then((r) =>
      r.ok ? r.json() : { enabled: false, groups: [] as CpGroup[] },
    )
    .then((d: { enabled: boolean; groups: CpGroup[] }) => {
      shared = { userId, enabled: d.enabled, groups: d.groups, at: Date.now() };
    })
    .catch(() => {
      shared = { userId, enabled: false, groups: [], at: Date.now() };
    })
    .finally(() => {
      inflight = null;
      emit();
    });
  return inflight;
}

function ensureFresh(userId: string) {
  if (
    !inflight &&
    (!shared || shared.userId !== userId || Date.now() - shared.at > STATE_TTL_MS)
  ) {
    void fetchState(userId);
  }
}

export function useDocsCp(): {
  status: CpStatus;
  groups: CpGroup[];
  refresh: () => void;
} {
  const { data: session, isPending } = useSession();
  const userId = session?.user.id ?? null;
  const snap = useSyncExternalStore(
    subscribe,
    () => shared,
    () => null as CpSnapshot | null,
  );

  useEffect(() => {
    if (userId) ensureFresh(userId);
  }, [userId]);

  const refresh = useCallback(() => {
    if (!userId) return;
    shared = null;
    ensureFresh(userId);
  }, [userId]);

  const current = userId && snap?.userId === userId ? snap : null;
  const groups = current?.groups ?? [];
  if (isPending) return { status: "loading", groups, refresh };
  if (!session) return { status: "signed-out", groups, refresh };
  if (!current) return { status: "loading", groups, refresh };
  if (!current.enabled) return { status: "unavailable", groups, refresh };
  return { status: "live", groups, refresh };
}

// The quiet line under an illustration telling signed-out readers the demo
// can do this for real. `unavailable` gets its own honest variant.
export function LiveHint({ status }: { status: CpStatus }) {
  const pathname = usePathname();
  if (status === "signed-out") {
    return (
      <p className="mt-3 text-center text-xs text-muted">
        <Link
          href={`/auth/sign-in?next=${encodeURIComponent(pathname)}`}
          className="underline underline-offset-2 transition-colors hover:text-foreground"
        >
          Sign in
        </Link>{" "}
        and this does it for real on your group.
      </p>
    );
  }
  if (status === "unavailable") {
    return (
      <p className="mt-3 text-center text-xs text-muted">
        Live actions are offline right now — this is what the dashboard shows.
      </p>
    );
  }
  return null;
}

// Group picker for live demos. Hidden when the user has exactly one group —
// the picker would be noise — callers read `groups[0]` in that case.
export function GroupField({
  groups,
  value,
  onChange,
}: {
  groups: CpGroup[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (groups.length <= 1) return null;
  return (
    <Select
      selectedKey={value}
      onSelectionChange={(k) => onChange(String(k))}
      className="w-full"
    >
      <Label>Group</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {groups.map((g) => (
            <ListBox.Item key={g.id} id={g.id}>
              {g.name}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

// Inline "name your group" for signed-in readers with no group yet —
// dead-ending them to a different page loses the moment.
export function CreateGroupInline({
  onCreated,
}: {
  onCreated: (g: CpGroup) => void;
}) {
  const [name, setName] = useState("Friday crew");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const create = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/cp/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as {
        group?: CpGroup;
        message?: string;
      };
      if (!res.ok || !data.group) {
        setErr(data.message ?? "Could not create the group");
        return;
      }
      onCreated(data.group);
    } catch {
      setErr("Could not reach the control plane");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-separator bg-surface-secondary p-4">
      <p className="text-xs leading-relaxed text-muted">
        Everything on Varde happens inside a group — you and your friends.
        Name yours to continue.
      </p>
      <div className="mt-3 flex items-end gap-2">
        <TextField
          name="groupName"
          value={name}
          onChange={setName}
          className="flex-1"
        >
          <Label>Group name</Label>
          <Input />
        </TextField>
        <Button
          size="sm"
          isDisabled={busy || !name.trim()}
          onPress={() => void create()}
        >
          {busy ? "Creating…" : "Create group"}
        </Button>
      </div>
      {err ? <p className="mt-2 text-xs text-danger">{err}</p> : null}
    </div>
  );
}

// Small fetch helper for the live demos: unwraps {error,message} responses.
export async function cpFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & {
    message?: string;
  };
  if (!res.ok) {
    throw new Error(data.message ?? `Something went wrong (${res.status})`);
  }
  return data;
}
