"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ToggleButton, ToggleButtonGroup } from "@heroui/react";

// Path picker for the "How Varde works" doc. Toggle between an open network
// path and a blocked one to see where game traffic actually travels: straight
// between machines when possible, through Varde's encrypted relay when not.

type Mode = "open" | "blocked";

const CAPTION_OPEN =
  "When nothing blocks the way, your game talks straight to the host machine. Shortest path, lowest ping.";
const CAPTION_BLOCKED =
  "No direct route, so the ember takes the long way through the relay. The traffic is encrypted end to end: the relay moves it, and cannot read it.";

const YOU = { x: 16, y: 42 };
const HOST = { x: 84, y: 42 };
const RELAY = { x: 50, y: 82 };

function Machine({
  at,
  name,
  sub,
}: {
  at: { x: number; y: number };
  name: string;
  sub: string;
}) {
  return (
    <div
      style={{ left: `${at.x}%`, top: `${at.y}%` }}
      className="absolute flex w-[30%] max-w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-2xl border border-separator bg-surface-200 p-3 text-center"
    >
      <motion.span
        className="mb-1.5 block size-2.5 rounded-full bg-success"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      />
      <span className="whitespace-nowrap text-sm font-semibold text-foreground">
        {name}
      </span>
      <span className="mt-0.5 whitespace-nowrap text-xs text-muted">{sub}</span>
    </div>
  );
}

export function PathPicker() {
  const [mode, setMode] = useState<Mode>("open");
  const blocked = mode === "blocked";

  return (
    <figure className="my-8 rounded-2xl border border-separator bg-surface-100 p-4 sm:p-6">
      <div className="mb-5 flex justify-center">
        <ToggleButtonGroup
          aria-label="Pick a network situation"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[mode]}
          onSelectionChange={(keys) => {
            const next = keys.values().next().value;
            if (next != null) setMode(next as Mode);
          }}
          size="sm"
        >
          <ToggleButton id="open">Open path</ToggleButton>
          <ToggleButton id="blocked">Blocked by router</ToggleButton>
        </ToggleButtonGroup>
      </div>

      <div className="relative mx-auto aspect-[10/7] w-full max-w-xl sm:aspect-[16/8]">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          {/* Direct path between the two machines. */}
          <line
            x1={YOU.x}
            y1={YOU.y}
            x2={HOST.x}
            y2={HOST.y}
            stroke="currentColor"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            strokeDasharray={blocked ? "3 3" : undefined}
            className={blocked ? "text-danger/60" : "text-glod/80"}
          />
          {/* Relay legs, only active in blocked mode. */}
          <line
            x1={YOU.x}
            y1={YOU.y}
            x2={RELAY.x}
            y2={RELAY.y}
            stroke="currentColor"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            className={blocked ? "text-glod/80" : "text-separator"}
            opacity={blocked ? 0.9 : 0.5}
          />
          <line
            x1={RELAY.x}
            y1={RELAY.y}
            x2={HOST.x}
            y2={HOST.y}
            stroke="currentColor"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            className={blocked ? "text-glod/80" : "text-separator"}
            opacity={blocked ? 0.9 : 0.5}
          />
        </svg>

        {/* The packet: an ember carrying your game data. */}
        <motion.span
          key={mode}
          className="absolute z-10 block size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-glod shadow-[0_0_12px_var(--color-glod)]"
          initial={false}
          animate={
            blocked
              ? {
                  left: [`${YOU.x}%`, `${RELAY.x}%`, `${HOST.x}%`],
                  top: [`${YOU.y}%`, `${RELAY.y}%`, `${HOST.y}%`],
                }
              : {
                  left: [`${YOU.x}%`, `${HOST.x}%`],
                  top: [`${YOU.y}%`, `${HOST.y}%`],
                }
          }
          transition={{
            duration: blocked ? 2.6 : 1.6,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />

        {/* Firewall between the machines when the path is blocked. */}
        <div
          className={`absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 transition-opacity ${
            blocked ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={!blocked}
        >
          <div className="flex flex-col gap-1 rounded-xl border border-danger/50 bg-surface-100 p-1.5">
            <div className="flex justify-center gap-1">
              <span className="h-1.5 w-4 bg-danger/40 sm:h-2 sm:w-5" />
              <span className="h-1.5 w-4 bg-danger/40 sm:h-2 sm:w-5" />
              <span className="h-1.5 w-4 bg-danger/40 sm:h-2 sm:w-5" />
            </div>
            <div className="flex justify-center gap-1">
              <span className="h-1.5 w-4 bg-danger/40 sm:h-2 sm:w-5" />
              <span className="h-1.5 w-4 bg-danger/40 sm:h-2 sm:w-5" />
            </div>
          </div>
        </div>

        <Machine at={YOU} name="You" sub="Playing" />
        <Machine at={HOST} name="Sara" sub="Hosting" />

        <div
          style={{ left: `${RELAY.x}%`, top: `${RELAY.y}%` }}
          className={`absolute flex w-[30%] max-w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-2xl border p-3 text-center transition-colors ${
            blocked
              ? "border-glod/60 bg-surface-200"
              : "border-separator bg-surface-200 opacity-50"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className={`mb-1.5 size-5 ${blocked ? "text-glod" : "text-muted"}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <rect x="6" y="10" width="12" height="9" rx="2" />
            <path d="M9 10V7a3 3 0 0 1 6 0v3" strokeLinecap="round" />
          </svg>
          <span className="whitespace-nowrap text-sm font-semibold text-foreground">
            Relay
          </span>
          <span className="mt-0.5 whitespace-nowrap text-xs text-muted">
            {blocked ? "Sealed shut" : "Standing by"}
          </span>
        </div>
      </div>

      {/* The caption stacks the live text over the longest variant so the
          box keeps one height and the page never shifts. */}
      <figcaption
        aria-live="polite"
        className="mt-5 grid rounded-xl border border-separator bg-surface-200 px-4 py-3 text-center text-sm text-muted"
      >
        <span className="invisible col-start-1 row-start-1" aria-hidden>
          {CAPTION_BLOCKED}
        </span>
        <span className="col-start-1 row-start-1">
          {blocked ? CAPTION_BLOCKED : CAPTION_OPEN}
        </span>
      </figcaption>
    </figure>
  );
}
