"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ToggleButton, ToggleButtonGroup } from "@heroui/react";

// Topology explorer for the "How Varde works" doc. A group of machines, the
// control plane, the relay, and the cairn (the shared world save). The role
// toggle highlights which pieces a player versus a host actually touches.
// Every node is a real button: tap one for a one-line job description.

type Role = "play" | "host";
type NodeId = "you" | "sara" | "kim" | "ada" | "cp" | "relay" | "cairn";

type Pt = { x: number; y: number };

const POS: Record<NodeId, Pt> = {
  cp: { x: 20, y: 17 },
  relay: { x: 80, y: 17 },
  cairn: { x: 50, y: 52 },
  you: { x: 14, y: 84 },
  sara: { x: 38, y: 90 },
  kim: { x: 62, y: 90 },
  ada: { x: 86, y: 84 },
};

const MACHINE_IDS = ["you", "sara", "kim", "ada"] as const;
type MachineId = (typeof MACHINE_IDS)[number];

const NAMES: Record<MachineId, string> = {
  you: "You",
  sara: "Sara",
  kim: "Kim",
  ada: "Ada",
};

function hostId(role: Role): MachineId {
  return role === "host" ? "you" : "sara";
}

function machineSub(id: MachineId, role: Role): string {
  const host = hostId(role);
  if (id === host) return "Hosting";
  return "Playing";
}

// One-line job descriptions, tuned to the selected role where it matters.
function describe(id: NodeId, role: Role): string {
  const host = hostId(role);
  switch (id) {
    case "you":
      return role === "host"
        ? "Your machine, hosting. It runs the world, keeps the live save, and still lets you play."
        : "Your machine. The agent on it keeps you linked to the group and holds a synced copy of the world while you play.";
    case "sara":
      return host === "sara"
        ? "A friend's machine, hosting right now. Everyone's game flows to and from it."
        : "A friend playing on your world, holding a copy of the save too.";
    case "kim":
      return "A friend's machine, playing. It keeps a synced copy of the save, ready if it is ever asked to host.";
    case "ada":
      return "A friend's machine, playing. It holds a copy of the save like everyone else.";
    case "cp":
      return "The control plane is Varde's address book. It hands out link codes, tells machines where to find each other, and keeps the copies in sync. It never sees your game.";
    case "relay":
      return "The relay is Varde's encrypted detour. When two machines cannot connect directly, traffic passes through here, sealed shut.";
    case "cairn":
      return "The cairn is your world save. Every machine keeps an identical synced copy, so the world survives a dropout.";
  }
}

// Which nodes a role meaningfully interacts with.
function litNodes(role: Role): Set<NodeId> {
  const host = hostId(role);
  if (role === "host") {
    return new Set<NodeId>(["you", "sara", "kim", "ada", "cp", "cairn"]);
  }
  return new Set<NodeId>(["you", host, "cp", "cairn"]);
}

type Edge = {
  a: NodeId;
  b: NodeId;
  kind: "cp" | "game" | "save" | "replica" | "relay";
};

function edges(role: Role): Edge[] {
  const host = hostId(role);
  const list: Edge[] = MACHINE_IDS.map((m) => ({ a: "cp", b: m, kind: "cp" }));
  list.push({ a: host, b: "cairn", kind: "save" });
  for (const m of MACHINE_IDS) {
    if (m !== host) list.push({ a: m, b: "cairn", kind: "replica" });
  }
  for (const m of MACHINE_IDS) {
    if (m !== host) list.push({ a: host, b: m, kind: "game" });
  }
  list.push({ a: "relay", b: "you", kind: "relay" });
  list.push({ a: "relay", b: "ada", kind: "relay" });
  return list;
}

function CairnsGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <rect x="9" y="4" width="6" height="4" rx="2" />
      <rect x="7" y="10" width="10" height="4" rx="2" />
      <rect x="4" y="16" width="16" height="4" rx="2" />
    </svg>
  );
}

export function TopologyExplorer() {
  const [role, setRole] = useState<Role>("play");
  const [selected, setSelected] = useState<NodeId | null>(null);

  const host = hostId(role);
  const lit = litNodes(role);
  const edgeList = edges(role);

  const nodeButton = (
    id: NodeId,
    label: string,
    sub: string,
    opts: { hosting?: boolean; icon?: React.ReactNode } = {},
  ) => {
    const p = POS[id];
    const isLit = lit.has(id);
    const isSel = selected === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => setSelected(isSel ? null : id)}
        aria-pressed={isSel}
        style={{ left: `${p.x}%`, top: `${p.y}%` }}
        className={`absolute flex w-[26%] max-w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-large border p-3 text-center transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glod sm:w-28 ${
          isSel
            ? "border-glod bg-glod/10"
            : opts.hosting
              ? "border-glod/60 bg-surface-200"
              : "border-separator bg-surface-200 hover:border-surface-400"
        } ${isLit ? "" : "opacity-45"}`}
      >
        {opts.icon ?? (
          <motion.span
            className={`mb-1.5 block size-2.5 rounded-full ${
              opts.hosting ? "bg-glod" : "bg-success"
            }`}
            animate={opts.hosting ? { scale: [1, 1.4, 1] } : { scale: 1 }}
            transition={{ duration: 2.2, repeat: Infinity }}
          />
        )}
        <span className="text-sm font-semibold text-foreground">
          {label}
        </span>
        <span className="mt-0.5 text-xs leading-tight text-muted">
          {sub}
        </span>
      </button>
    );
  };

  return (
    <figure className="my-8 rounded-large border border-separator bg-surface-100 p-4 sm:p-6">
      <div className="mb-5 flex justify-center">
        <ToggleButtonGroup
          aria-label="Pick your role"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[role]}
          onSelectionChange={(keys) => {
            const next = keys.values().next().value;
            if (next != null) setRole(next as Role);
          }}
          size="sm"
        >
          <ToggleButton id="play">I just play</ToggleButton>
          <ToggleButton id="host">I host</ToggleButton>
        </ToggleButtonGroup>
      </div>

      <div className="relative mx-auto aspect-[10/9] w-full max-w-xl sm:aspect-[16/10]">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          {edgeList.map((e) => {
            const a = POS[e.a];
            const b = POS[e.b];
            const isLit =
              e.kind === "relay" || e.kind === "replica"
                ? false
                : lit.has(e.a) && lit.has(e.b) &&
                  (e.kind !== "cp" ||
                    e.b === "you" ||
                    (role === "host" && e.b === host));
            return (
              <line
                key={`${e.kind}-${e.a}-${e.b}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="currentColor"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                strokeDasharray={
                  e.kind === "relay" || e.kind === "replica" ? "2 2" : undefined
                }
                className={
                  e.kind === "replica"
                    ? "text-glod/60"
                    : e.kind === "relay"
                      ? "text-separator"
                      : isLit
                        ? "text-glod/70"
                        : "text-separator"
                }
                opacity={
                  e.kind === "relay" ? 0.7 : e.kind === "replica" ? 0.8 : isLit ? 0.9 : 0.4
                }
              />
            );
          })}
        </svg>

        {nodeButton("cp", "Control plane", "Address book", {
          icon: (
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              className="mb-1.5 size-5 text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <rect x="4" y="5" width="16" height="14" rx="2.5" />
              <path d="M8 9h8M8 13h5" strokeLinecap="round" />
            </svg>
          ),
        })}
        {nodeButton("relay", "Relay", "Encrypted detour", {
          icon: (
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              className="mb-1.5 size-5 text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <rect x="6" y="10" width="12" height="9" rx="2" />
              <path d="M9 10V7a3 3 0 0 1 6 0v3" strokeLinecap="round" />
            </svg>
          ),
        })}
        {nodeButton("cairn", "The world", "Shared save", {
          icon: <CairnsGlyph className="mb-1.5 size-5 text-glod" />,
        })}

        {MACHINE_IDS.map((id) =>
          nodeButton(id, NAMES[id], machineSub(id, role), {
            hosting: id === host,
          }),
        )}
      </div>

      <figcaption
        aria-live="polite"
        className="mt-5 min-h-10 rounded-medium border border-separator bg-surface-200 px-4 py-3 text-center text-sm text-muted"
      >
        {selected
          ? describe(selected, role)
          : role === "host"
            ? "You are hosting. Everything lit is part of your job: the world, the players, the check-ins."
            : "You are playing. The lit pieces are all you touch. Tap any piece to see what it does."}
      </figcaption>
    </figure>
  );
}
