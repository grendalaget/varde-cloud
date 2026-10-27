"use client";

import {
  Alert,
  Button,
  Card,
  Chip,
  Input,
  Label,
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

interface CpSaveHolder {
  node_id: string;
  name: string;
  anchor: boolean;
  online: boolean;
  last_seen_at?: number | null;
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
    latest_safe_save?: {
      snapshot_id: string;
      created_at: number;
      replicas?: CpSaveHolder[];
    } | null;
    latest_save?: {
      snapshot_id: string;
      created_at: number;
      replicas?: CpSaveHolder[];
    } | null;
  } | null;
}

interface GroupDetail {
  nodes: CpNode[] | null; // null = fetch failed
  servers: CpServer[] | null;
}

// Row from /api/anchors — desired vs actual; the reconciler converges them.
interface CloudAnchorRow {
  groupId: string;
  desired: string;
  status: string;
  mine: boolean; // the viewer is the subscriber
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

export function HostingDashboard({
  plan,
  billingEnabled,
}: {
  plan: string;
  billingEnabled: boolean;
}) {
  const [groups, setGroups] = useState<CpGroup[] | null>(null);
  const [details, setDetails] = useState<Record<string, GroupDetail>>({});
  const [anchors, setAnchors] = useState<Record<string, CloudAnchorRow>>({});
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  // A transient refresh failure must not unmount loaded content (it would
  // wipe in-progress form input) — only the initial load uses the error card.
  const hasData = useRef(false);
  // Latest-call wins: an older overlapping load (e.g. the 30s poll started
  // before a create/join refresh) must not clobber a newer group list.
  const loadSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    const isCurrent = () => seq === loadSeq.current;
    setError(null);
    try {
      const res = await fetch("/api/cp/groups", { cache: "no-store" });
      const data = (await res.json()) as {
        groups?: CpGroup[];
        message?: string;
      };
      if (!isCurrent()) return;
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
      // Anchor rows ride the same refresh: failures just leave stale data.
      try {
        const aRes = await fetch("/api/anchors", { cache: "no-store" });
        const aData = (await aRes.json()) as { anchors?: CloudAnchorRow[] };
        if (isCurrent() && aRes.ok && aData.anchors) {
          // Only rows still converging count: 'gone' is final and
          // 'deprovisioning' means teardown finished (the volume alone is
          // retained for the recovery grace) — both leave the group with
          // no running anchor, so the card falls back to the attach
          // affordance.
          const live = aData.anchors.filter(
            (a) => a.status !== "gone" && a.status !== "deprovisioning",
          );
          setAnchors(Object.fromEntries(live.map((a) => [a.groupId, a])));
        }
      } catch {
        // keep prior anchor map
      }
      const entries = await Promise.all(
        data.groups.map(async (g) => {
          const gid = encodeURIComponent(g.id);
          try {
            const [nodesRes, serversRes] = await Promise.all([
              fetch(`/api/cp/groups/${gid}/nodes`, { cache: "no-store" }),
              fetch(`/api/cp/groups/${gid}/servers`, { cache: "no-store" }),
            ]);
            const nodes = nodesRes.ok
              ? (((await nodesRes.json()) as { nodes?: CpNode[] }).nodes ?? null)
              : null;
            const servers = serversRes.ok
              ? (((await serversRes.json()) as { servers?: CpServer[] })
                  .servers ?? null)
              : null;
            return [g.id, { nodes, servers }] as const;
          } catch {
            return [g.id, { nodes: null, servers: null }] as const;
          }
        }),
      );
      // A stale load's details are still valid per-group data: merge them for
      // groups lacking details instead of discarding, but never overwrite
      // fresher entries.
      const detailMap = Object.fromEntries(entries);
      setDetails((prev) => {
        const next = { ...prev };
        for (const [gid, d] of Object.entries(detailMap)) {
          if (isCurrent() || !(gid in next)) next[gid] = d;
        }
        return next;
      });
    } catch {
      if (!isCurrent()) return;
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
          <Spinner size="sm" /> Loading your groups
        </div>
      </Card>
    );
  }

  if (groups.length === 0) {
    return <EmptyGroups stale={stale} onChanged={() => void load()} />;
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => (
        <GroupCard
          key={g.id}
          group={g}
          detail={details[g.id]}
          anchor={anchors[g.id]}
          plan={plan}
          billingEnabled={billingEnabled}
          onAnchorChanged={() => void load()}
        />
      ))}
      {stale ? (
        <p className="text-xs text-muted">
          Couldn&apos;t refresh, retrying automatically.
        </p>
      ) : null}
      <JoinInline onJoined={() => void load()} />
    </div>
  );
}

function GroupCard({
  group,
  detail,
  anchor,
  plan,
  billingEnabled,
  onAnchorChanged,
}: {
  group: CpGroup;
  detail?: GroupDetail;
  anchor?: CloudAnchorRow;
  plan: string;
  billingEnabled: boolean;
  onAnchorChanged: () => void;
}) {
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
            <Spinner size="sm" /> Loading
          </div>
        ) : detail.servers === null ? (
          <p className="mt-3 text-sm text-danger">
            Couldn&apos;t load servers, retrying automatically.
          </p>
        ) : detail.servers.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No servers yet. Create one from the Varde app on any linked
            machine.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-separator">
            {detail.servers.map((s) => {
              // resume needs the newest save — show/evaluate its holders,
              // not the older committed save's
              const holders =
                s.summary?.latest_save?.replicas ??
                s.summary?.latest_safe_save?.replicas ??
                [];
              // resume needs the newest save; no ready holders at all is
              // just as blocked as all-offline
              const allOffline =
                s.summary?.latest_save != null &&
                (holders.length === 0 || holders.every((h) => !h.online));
              return (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {s.name}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {s.game_id}
                      {s.summary?.address ? `, ${s.summary.address}` : ""}
                      {holders.length > 0
                        ? `, save on ${holders
                            .map((h) =>
                              h.online ? h.name : `${h.name} (offline)`,
                            )
                            .join(", ")}`
                        : s.summary?.only_on_one_machine
                          ? ", save on one machine"
                          : ""}
                    </p>
                    {allOffline ? (
                      <p className="truncate text-xs text-warning">
                        No machine with the latest save is online — the
                        newest save can&apos;t be restored until one comes
                        back.
                      </p>
                    ) : null}
                  </div>
                  <Chip
                    size="sm"
                    color={STATE_COLORS[s.observed_state] ?? "default"}
                    variant="soft"
                  >
                    <Chip.Label>{s.observed_state}</Chip.Label>
                  </Chip>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Machines
        </h3>
        {!detail ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Spinner size="sm" /> Loading
          </div>
        ) : detail.nodes === null ? (
          <p className="mt-3 text-sm text-danger">
            Couldn&apos;t load machines, retrying automatically.
          </p>
        ) : detail.nodes.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No machines linked. Install Varde on a computer and link it to add
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
                  {n.os ? `, ${n.os}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {billingEnabled && (group.role === "owner" || group.role === "admin") ? (
        <AnchorSection
          group={group}
          anchor={anchor}
          plan={plan}
          onChanged={onAnchorChanged}
        />
      ) : null}
    </Card>
  );
}

function AnchorSection({
  group,
  anchor,
  plan,
  onChanged,
}: {
  group: CpGroup;
  anchor?: CloudAnchorRow;
  plan: string;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const paid = plan === "anchor" || plan === "anchor+";
  // 'deprovisioning' means teardown already finished (the row only
  // remains because the volume is kept for the recovery grace) — the
  // group has no running anchor, so the attach affordance returns and
  // POST revives this same row.
  const live =
    anchor && anchor.status !== "gone" && anchor.status !== "deprovisioning";
  // Any group admin can remove the anchor. The label shows who pays for it.
  const mine = anchor?.mine === true;

  const call = async (method: "POST" | "DELETE") => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/anchors", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: group.id }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!res.ok) {
        setErr(data.message ?? "Could not update the cloud anchor");
        return;
      }
      onChanged();
    } catch {
      setErr("Could not update the cloud anchor");
    } finally {
      setBusy(false);
    }
  };

  // Error first: a failed teardown leaves desired='detached', which must
  // not mask the recorded error behind a perpetual "removing".
  const statusText = live
    ? anchor!.status === "error" || anchor!.status === "conflict"
      ? "error"
      : anchor!.desired === "detached"
        ? "removing"
        : anchor!.status === "online"
          ? "online"
          : "provisioning"
    : null;

  return (
    <div className="mt-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
        Cloud anchor
      </h3>
      {live ? (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
            {statusText === "online" ? (
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full bg-success"
              />
            ) : null}
            {statusText === "provisioning" || statusText === "removing" ? (
              <Spinner size="sm" />
            ) : null}
            <p className="truncate text-foreground">
              {statusText === "error"
                ? anchor!.status === "conflict"
                  ? "Blocked by another cloud anchor"
                  : "Something went wrong with this cloud anchor"
                : statusText === "provisioning"
                  ? "Provisioning, usually under a minute"
                  : statusText === "removing"
                    ? "Removing"
                    : "Online, saving replicas for the whole group"}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 sm:shrink-0">
            {statusText !== "removing" ? (
              <Button
                variant="tertiary"
                size="sm"
                className="shrink-0 whitespace-nowrap"
                isDisabled={busy}
                onPress={() => void call("DELETE")}
              >
                Remove
              </Button>
            ) : null}
            {!mine ? (
              <span className="shrink-0 whitespace-nowrap text-xs text-muted">
                paid for by another admin
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          {paid ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted">
                An always-on machine that keeps a copy of every save in this
                group.
              </p>
              <Button
                variant="secondary"
                size="sm"
                isPending={busy}
                onPress={() => void call("POST")}
              >
                Add
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted">
              An always-on machine that keeps a copy of every save in this
              group. Part of the{" "}
              <a href="/pricing" className="text-glod">
                Anchor plan
              </a>
              .
            </p>
          )}
        </div>
      )}
      {err ? <p className="mt-2 text-xs text-danger">{err}</p> : null}
    </div>
  );
}

function EmptyGroups({
  stale,
  onChanged,
}: {
  stale: boolean;
  onChanged: () => void;
}) {
  return (
    <Card className="rounded-2xl border border-separator bg-surface p-6">
      <h2 className="font-display text-lg font-semibold">Your groups</h2>
      <p className="mt-3 text-sm text-muted">
        A group is where your game servers and machines live. Create one, or
        join a friend&apos;s with an invite code.
      </p>
      {stale ? (
        <p className="mt-3 text-xs text-muted">
          Couldn&apos;t refresh, retrying automatically.
        </p>
      ) : null}
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
        let data: { message?: string };
        try {
          data = (await res.json()) as { message?: string };
        } catch {
          data = {};
        }
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
        <Input placeholder="x7k2m9" />
      </TextField>
      <Button type="submit" variant="secondary" isPending={busy} isDisabled={!code.trim()}>
        {busy ? <Spinner color="current" size="sm" /> : null}
        Join
      </Button>
      {err ? <p className="text-sm text-danger">{err}</p> : null}
    </form>
  );
}
