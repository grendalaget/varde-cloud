"use client";

import { useState } from "react";
import { motion } from "motion/react";

// Failover timeline for the "How Varde works" doc. Step through what happens
// when the machine hosting the world drops: the replica on the backup host
// takes over, Varde appoints a new host, and everyone keeps playing. The lit
// save chip physically moves between machines as you step.

type MachineId = "you" | "sara" | "kim" | "ada";

type Tone = "ok" | "ember" | "warn" | "danger" | "off";

type Step = {
  title: string;
  text: string;
  cp: string;
  cpLit: boolean;
  liveSaveOn: MachineId;
  machines: Record<MachineId, { tone: Tone; sub: string }>;
};

const MACHINE_IDS: MachineId[] = ["you", "sara", "kim", "ada"];

const NAMES: Record<MachineId, string> = {
  you: "You",
  sara: "Sara",
  kim: "Kim",
  ada: "Ada",
};

const STEPS: Step[] = [
  {
    title: "Sara hosts",
    text: "Sara's machine runs the world. Everyone else plays on it, and Kim quietly holds an identical copy of the save.",
    cp: "watching over the group",
    cpLit: false,
    liveSaveOn: "sara",
    machines: {
      you: { tone: "ok", sub: "playing" },
      sara: { tone: "ember", sub: "hosting the world" },
      kim: { tone: "ok", sub: "backup host" },
      ada: { tone: "ok", sub: "playing" },
    },
  },
  {
    title: "Sara drops",
    text: "Her laptop closes mid-game. The world is unreachable for a moment, and the control plane notices she is gone.",
    cp: "notices Sara is gone",
    cpLit: true,
    liveSaveOn: "sara",
    machines: {
      you: { tone: "warn", sub: "connection lost" },
      sara: { tone: "danger", sub: "offline" },
      kim: { tone: "warn", sub: "connection lost" },
      ada: { tone: "warn", sub: "connection lost" },
    },
  },
  {
    title: "The copy wakes up",
    text: "Kim's replica was synced all along, so it already has everyone's progress. It becomes the live save.",
    cp: "finds a machine with a copy",
    cpLit: true,
    liveSaveOn: "kim",
    machines: {
      you: { tone: "warn", sub: "waiting" },
      sara: { tone: "off", sub: "offline" },
      kim: { tone: "ok", sub: "save copy activates" },
      ada: { tone: "warn", sub: "waiting" },
    },
  },
  {
    title: "Kim takes over",
    text: "The control plane picks Kim as the new host and points every machine at her.",
    cp: "points everyone at Kim",
    cpLit: true,
    liveSaveOn: "kim",
    machines: {
      you: { tone: "warn", sub: "reconnecting" },
      sara: { tone: "off", sub: "offline" },
      kim: { tone: "ember", sub: "new host" },
      ada: { tone: "warn", sub: "reconnecting" },
    },
  },
  {
    title: "Back to playing",
    text: "The game resumes on Kim with nothing lost. When Sara comes back, she rejoins as a player and can host again later.",
    cp: "keeping the lights on",
    cpLit: false,
    liveSaveOn: "kim",
    machines: {
      you: { tone: "ok", sub: "playing" },
      sara: { tone: "off", sub: "can rejoin anytime" },
      kim: { tone: "ember", sub: "hosting the world" },
      ada: { tone: "ok", sub: "playing" },
    },
  },
];

const DOT: Record<Tone, string> = {
  ok: "bg-success",
  ember: "bg-glod",
  warn: "bg-warning",
  danger: "bg-danger",
  off: "bg-surface-400",
};

export function FailoverTimeline() {
  const [step, setStep] = useState(0);
  const s = STEPS[step];

  return (
    <figure className="my-8 rounded-large border border-separator bg-surface-100 p-4 sm:p-6">
      <div className="mb-4 flex justify-center">
        <div
          className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs transition-colors ${
            s.cpLit
              ? "border-glod/60 bg-glod/10 text-foreground"
              : "border-separator bg-surface-200 text-muted"
          }`}
        >
          <span
            aria-hidden
            className={`block size-1.5 rounded-full ${s.cpLit ? "bg-glod" : "bg-muted"}`}
          />
          <span className="font-semibold text-foreground">Control plane</span>
          <span aria-live="polite">{s.cp}</span>
        </div>
      </div>

      <div className="mx-auto grid max-w-xl grid-cols-4 gap-2 sm:gap-3">
        {MACHINE_IDS.map((id) => {
          const m = s.machines[id];
          const isOffline = m.tone === "danger" || m.tone === "off";
          const hasLiveSave = s.liveSaveOn === id;
          const staticCopy =
            (id === "kim" && step < 2) || (id === "sara" && step >= 2);
          return (
            <div
              key={id}
              className={`flex min-h-28 flex-col items-center rounded-large border p-2.5 text-center transition-colors sm:min-h-32 sm:p-3 ${
                m.tone === "ember"
                  ? "border-glod/60 bg-glod/10"
                  : isOffline
                    ? "border-separator bg-surface-200 opacity-50"
                    : "border-separator bg-surface-200"
              }`}
            >
              <motion.span
                className={`mb-1.5 block size-2.5 rounded-full ${DOT[m.tone]}`}
                animate={
                  m.tone === "ember" ? { scale: [1, 1.4, 1] } : { scale: 1 }
                }
                transition={{ duration: 2.2, repeat: Infinity }}
              />
              <span className="text-xs font-semibold text-foreground sm:text-sm">
                {NAMES[id]}
              </span>
              <span className="mt-0.5 text-[10px] leading-tight text-muted sm:text-xs">
                {m.sub}
              </span>
              <span className="mt-2 flex h-6 items-center">
                {hasLiveSave ? (
                  <motion.span
                    layoutId="live-save"
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      id === "sara" && m.tone !== "ember"
                        ? "border-separator bg-surface-300 text-muted"
                        : "border-glod/60 bg-glod/10 text-glod"
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden
                      className="size-3"
                      fill="currentColor"
                    >
                      <rect x="9" y="4" width="6" height="4" rx="2" />
                      <rect x="7" y="10" width="10" height="4" rx="2" />
                      <rect x="4" y="16" width="16" height="4" rx="2" />
                    </svg>
                    live save
                  </motion.span>
                ) : staticCopy ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-separator bg-surface-300 px-2 py-0.5 text-[10px] text-muted">
                    {id === "kim" ? "replica" : "last copy"}
                  </span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>

      <figcaption
        aria-live="polite"
        className="mt-5 min-h-12 rounded-medium border border-separator bg-surface-200 px-4 py-3 text-center text-sm text-muted"
      >
        <span className="mb-0.5 block font-semibold text-foreground">
          {s.title}
        </span>
        {s.text}
      </figcaption>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => setStep((v) => Math.max(0, v - 1))}
          disabled={step === 0}
          className="rounded-full border border-separator bg-surface-200 px-3.5 py-1.5 text-sm text-foreground transition-colors hover:border-surface-400 disabled:opacity-40"
        >
          Back
        </button>
        <div className="flex items-center gap-1.5" role="group" aria-label="Timeline steps">
          {STEPS.map((st, i) => (
            <button
              key={st.title}
              type="button"
              aria-label={`Step ${i + 1}: ${st.title}`}
              aria-current={i === step}
              onClick={() => setStep(i)}
              className={`size-2 rounded-full transition-colors ${
                i === step ? "bg-glod" : "bg-surface-400 hover:bg-muted"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setStep((v) => Math.min(STEPS.length - 1, v + 1))}
          disabled={step === STEPS.length - 1}
          className="rounded-full border border-separator bg-surface-200 px-3.5 py-1.5 text-sm text-foreground transition-colors hover:border-surface-400 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </figure>
  );
}
