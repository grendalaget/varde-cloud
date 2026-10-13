"use client";

import {
  Alert,
  Button,
  Card,
  Chip,
  Input,
  Label,
  Link,
  Spinner,
  TextField,
} from "@heroui/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface CpGroup {
  id: string;
  name: string;
  role: string;
}

interface CpNode {
  id: string;
  name: string;
  online: boolean;
  liveness?: string;
  anchor?: boolean;
  os?: string;
}

interface CpServer {
  id: string;
  name: string;
  game_id: string;
  observed_state: string;
  service?: { loopback_ip: string } | null;
  summary?: {
    address?: string | null;
    only_on_one_machine?: boolean;
  } | null;
}

interface GroupDetail {
  nodes: CpNode[] | null; // null = fetch failed
  servers: CpServer[] | null;
}

// Accepts a bare code ("x7k2m9") or a pasted invite link
// ("cp.varde.games/invite/x7k2m9", "...?code=x7k2m9").
function parseInviteCode(raw: string): string {
  const t = raw.trim();
  if (!t || (!t.includes("/") && !t.includes("?"))) return t;
  try {
    const u = new URL(t.includes("://") ? t : `https://${t}`);
    const q = u.searchParams.get("code");
    if (q) return q.trim();
    const segs = u.pathname.split("/").filter(Boolean);
    return segs[segs.length - 1] ?? t;
  } catch {
    return t;
  }
}

const STATE_COLORS: Record<string, "success" | "warning" | "danger" | "default"> = {
  running: "success",
  preparing: "warning",
  restoring: "warning",
  starting: "warning",
  stopping: "warning",
  failed: "danger",
};

export function HostingDashboard() {
  const [groups, setGroups] = useState<CpGroup[] | null>(null);
  const [details, setDetails] = useState<Record<string, GroupDetail>>({});
  const [error, setError] = useState<string | null>(null);
  const [needsLink, setNeedsLink] = useState(false);
  const [stale, setStale] = useState(false);
  // A transient refresh failure must not unmount loaded content (it would
  // wipe in-progress form input) — only the initial load uses the error card.
  const hasData = useRef(false);

  const load = useCallback(async () => {
    setError(null);
    setNeedsLink(false);
    try {
      const res = await fetch("/api/cp/groups", { cache: "no-store" });
      if (res.status === 409) {
        setNeedsLink(true);
        setGroups([]);
        return;
      }
      const data = (await res.json()) as {
        groups?: CpGroup[];
        message?: string;
      };
      if (!res.ok || !data.groups) {
        if (!hasData.current) {
          setError(data.message ?? "Could not reach the control plane");
          setGroups([]);
        } else {
          setStale(true);
        }
        return;
      }
      setGroups(data.groups);
      hasData.current = true;
      setStale(false);
      const entries = await Promise.all(
        data.groups.map(async (g) => {
          const gid = encodeURIComponent(g.id);
          const [nodesRes, serversRes] = await Promise.all([
            fetch(`/api/cp/groups/${gid}/nodes`, { cache: "no-store" }),
            fetch(`/api/cp/groups/${gid}/servers`, { cache: "no-store" }),
          ]);
          const nodes = nodesRes.ok
            ? (((await nodesRes.json()) as { nodes?: CpNode[] }).nodes ?? null)
            : null;
          const servers = serversRes.ok
            ? (((await serversRes.json()) as { servers?: CpServer[] }).servers ??
                null)
            : null;
          return [g.id, { nodes, servers }] as const;
        }),
      );
      setDetails(Object.fromEntries(entries));
    } catch {
      if (!hasData.current) {
        setError("Could not reach the control plane");
        setGroups([]);
      } else {
        setStale(true);
      }
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
    const id = setInterval(() => void load(), 30_000);
    return () => clearInterval(id);
  }, [load]);

  if (needsLink) {
    return (
      <Card className="rounded-2xl border border-separator bg-surface p-6">
        <h2 className="font-display text-lg font-semibold">Your groups</h2>
        <p className="mt-3 text-sm text-muted">
          This email already has an account on the hosted control plane. Sign in
          once at{" "}
          <Link href="https://cp.varde.games" target="_blank" rel="noreferrer">
            cp.varde.games
          </Link>{" "}
          to link it — after that your groups show up here.
        </p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl border border-separator bg-surface p-6">
        <h2 className="font-display text-lg font-semibold">Your groups</h2>
        <Alert status="warning" className="mt-4">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
        <Button variant="secondary" className="mt-5 w-fit" onPress={() => void load()}>
          Retry
        </Button>
      </Card>
    );
  }

  if (groups === null) {
    return (
      <Card className="rounded-2xl border border-separator bg-surface p-6">
        <h2 className="font-display text-lg font-semibold">Your groups</h2>
        <div className="mt-6 flex items-center gap-3 text-sm text-muted">
          <Spinner size="sm" /> Loading your groups…
        </div>
      </Card>
    );
  }

  if (groups.length === 0) {
    return <EmptyGroups onChanged={() => void load()} />;
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => (
        <GroupCard key={g.id} group={g} detail={details[g.id]} />
      ))}
      {stale ? (
        <p className="text-xs text-muted">
          Couldn&apos;t refresh — retrying automatically.
        </p>
      ) : null}
      <JoinInline onJoined={() => void load()} />
    </div>
  );
}

function GroupCard({ group, detail }: { group: CpGroup; detail?: GroupDetail }) {
  return (
    <Card className="rounded-2xl border border-separator bg-surface p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">{group.name}</h2>
        <Chip variant="secondary" size="sm">
          <Chip.Label>{group.role}</Chip.Label>
        </Chip>
      </div>

      <div className="mt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Servers
        </h3>
        {!detail ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Spinner size="sm" /> Loading…
          </div>
        ) : detail.servers === null ? (
          <p className="mt-3 text-sm text-danger">
            Couldn&apos;t load servers — retrying automatically.
          </p>
        ) : detail.servers.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No servers yet — create one from the Varde app on any linked
            machine.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-separator">
            {detail.servers.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {s.name}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {s.game_id}
                    {s.summary?.address ? ` · ${s.summary.address}` : ""}
                    {s.summary?.only_on_one_machine
                      ? " · save on one machine"
                      : ""}
                  </p>
                </div>
                <Chip
                  size="sm"
                  color={STATE_COLORS[s.observed_state] ?? "default"}
                  variant="soft"
                >
                  <Chip.Label>{s.observed_state}</Chip.Label>
                </Chip>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Machines
        </h3>
        {!detail ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Spinner size="sm" /> Loading…
          </div>
        ) : detail.nodes === null ? (
          <p className="mt-3 text-sm text-danger">
            Couldn&apos;t load machines — retrying automatically.
          </p>
        ) : detail.nodes.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No machines linked — install Varde on a computer and link it to add
            one.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-separator">
            {detail.nodes.map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      n.online ? "bg-success" : "bg-muted/40"
                    }`}
                  />
                  <p className="truncate text-sm font-medium text-foreground">
                    {n.name}
                  </p>
                  {n.anchor ? (
                    <Chip size="sm" variant="secondary">
                      <Chip.Label>anchor</Chip.Label>
                    </Chip>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {n.online ? "online" : (n.liveness ?? "offline")}
                  {n.os ? ` · ${n.os}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function EmptyGroups({ onChanged }: { onChanged: () => void }) {
  return (
    <Card className="rounded-2xl border border-separator bg-surface p-6">
      <h2 className="font-display text-lg font-semibold">Your groups</h2>
      <p className="mt-3 text-sm text-muted">
        A group is where your game servers and machines live. Create one, or
        join a friend&apos;s with an invite code.
      </p>
      <CreateGroupForm onCreated={onChanged} />
      <JoinInline onJoined={onChanged} />
    </Card>
  );
}

function CreateGroupForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
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
      const data = (await res.json()) as { group?: unknown; message?: string };
      if (!res.ok || !data.group) {
        setErr(data.message ?? "Could not create the group");
        return;
      }
      onCreated();
    } catch {
      setErr("Could not reach the control plane");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="mt-5 flex items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void create();
      }}
    >
      <TextField className="flex-1" value={name} onChange={setName} isRequired>
        <Label>Group name</Label>
        <Input placeholder="Friday crew" />
      </TextField>
      <Button type="submit" isPending={busy} isDisabled={!name.trim()}>
        {busy ? <Spinner color="current" size="sm" /> : null}
        Create
      </Button>
      {err ? <p className="text-sm text-danger">{err}</p> : null}
    </form>
  );
}

function JoinInline({ onJoined }: { onJoined: () => void }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const join = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/cp/invites/${encodeURIComponent(parseInviteCode(code))}/accept`,
        { method: "POST" },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        setErr(data.message ?? "That invite code did not work");
        return;
      }
      setCode("");
      setOpen(false);
      onJoined();
    } catch {
      setErr("Could not reach the control plane");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button
        variant="tertiary"
        size="sm"
        className="self-start"
        onPress={() => setOpen(true)}
      >
        Have an invite code? Join a group
      </Button>
    );
  }

  return (
    <form
      className="flex items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void join();
      }}
    >
      <TextField className="flex-1" value={code} onChange={setCode} isRequired>
        <Label>Invite code</Label>
        <Input placeholder="x7k2m9…" />
      </TextField>
      <Button type="submit" variant="secondary" isPending={busy} isDisabled={!code.trim()}>
        {busy ? <Spinner color="current" size="sm" /> : null}
        Join
      </Button>
      {err ? <p className="text-sm text-danger">{err}</p> : null}
    </form>
  );
}
