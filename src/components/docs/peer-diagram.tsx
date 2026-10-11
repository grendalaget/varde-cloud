"use client";

import { useState } from "react";
import { motion } from "motion/react";

// Interactive peer diagram for docs. Tap a machine to see who keeps the
// server alive when that machine goes offline. Convention: interactive
// docs pieces are client components that render real UI (not screenshots)
// in the mouve palette.

type Node = { id: string; label: string; sub: string };

const NODES: Node[] = [
  { id: "you", label: "You", sub: "Playing now" },
  { id: "sara", label: "Sara", sub: "Hosting the world" },
  { id: "kim", label: "Kim", sub: "Backup host" },
  { id: "ada", label: "Ada", sub: "Playing now" },
];

export function PeerDiagram() {
  const [down, setDown] = useState<string | null>(null);

  const saraDown = down === "sara";

  return (
    <figure className="my-8 rounded-2xl border border-separator bg-surface-100 p-6">
      <div className="flex flex-wrap items-start justify-center gap-4">
        {NODES.map((node) => {
          const isDown = down === node.id;
          const takesOver = saraDown && node.id === "kim";
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => setDown(isDown ? null : node.id)}
              className={`flex w-32 flex-col items-center rounded-2xl border p-4 text-center transition-colors ${
                isDown
                  ? "border-danger/60 bg-danger/10 opacity-60"
                  : takesOver
                    ? "border-glod bg-glod/10"
                    : "border-separator bg-surface-200 hover:border-surface-400"
              }`}
            >
              <motion.span
                className={`mb-2 block size-3 rounded-full ${isDown ? "bg-danger" : takesOver ? "bg-glod" : "bg-success"}`}
                animate={
                  isDown ? { scale: 1 } : { scale: [1, 1.35, 1] }
                }
                transition={{ duration: 2.4, repeat: Infinity }}
              />
              <span className="text-sm font-semibold text-foreground">
                {node.label}
              </span>
              <span className="mt-0.5 text-xs text-muted">
                {isDown
                  ? "Offline"
                  : takesOver
                    ? "Takes over hosting"
                    : node.sub}
              </span>
            </button>
          );
        })}
      </div>
      <figcaption className="mt-5 text-center text-sm text-muted">
        {down === null
          ? "Tap a machine to take it offline."
          : saraDown
            ? "Sara's machine dropped. Varde hands the world to Kim, and nobody's progress is lost."
            : "Everyone else keeps playing. Reconnect to rejoin."}
      </figcaption>
    </figure>
  );
}
