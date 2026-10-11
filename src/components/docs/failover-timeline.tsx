"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Button,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";

// Failover timeline for the "How Varde works" doc. Step through what happens
// when the machine hosting the world drops: a synced copy on another machine
// goes live, Varde appoints a new host, and everyone keeps playing. The live
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
    text: "Sara's machine runs the world. Everyone else plays on it, and every machine quietly holds an identical copy of the save.",
    cp: "Watching over the group",
    cpLit: false,
    liveSaveOn: "sara",
    machines: {
      you: { tone: "ok", sub: "Playing" },
      sara: { tone: "ember", sub: "Hosting" },
      kim: { tone: "ok", sub: "Playing" },
      ada: { tone: "ok", sub: "Playing" },
    },
  },
  {
    title: "Sara drops",
    text: "Her laptop closes mid-game. The world is unreachable for a moment, and the control plane notices she is gone.",
    cp: "Notices Sara is gone",
    cpLit: true,
    liveSaveOn: "sara",
    machines: {
      you: { tone: "warn", sub: "Disconnected" },
      sara: { tone: "danger", sub: "Offline" },
      kim: { tone: "warn", sub: "Disconnected" },
      ada: { tone: "warn", sub: "Disconnected" },
    },
  },
  {
    title: "The copy wakes up",
    text: "The copies were synced all along, so Kim's already has everyone's progress. Hers becomes the live save.",
    cp: "Finds a machine with a copy",
    cpLit: true,
    liveSaveOn: "kim",
    machines: {
      you: { tone: "warn", sub: "Waiting" },
      sara: { tone: "off", sub: "Offline" },
      kim: { tone: "ok", sub: "Goes live" },
      ada: { tone: "warn", sub: "Waiting" },
    },
  },
  {
    title: "Kim takes over",
    text: "The control plane picks Kim as the new host and points every machine at her.",
    cp: "Points everyone at Kim",
    cpLit: true,
    liveSaveOn: "kim",
    machines: {
      you: { tone: "warn", sub: "Reconnecting" },
      sara: { tone: "off", sub: "Offline" },
      kim: { tone: "ember", sub: "New host" },
      ada: { tone: "warn", sub: "Reconnecting" },
    },
  },
  {
    title: "Back to playing",
    text: "The game resumes on Kim with nothing lost. When Sara comes back, she rejoins as a player and can host again later.",
    cp: "Keeping the lights on",
    cpLit: false,
    liveSaveOn: "kim",
    machines: {
      you: { tone: "ok", sub: "Playing" },
      sara: { tone: "off", sub: "Rejoins later" },
      kim: { tone: "ember", sub: "Hosting" },
      ada: { tone: "ok", sub: "Playing" },
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
    <figure className="my-8 rounded-2xl border border-separator bg-surface-100 p-4 sm:p-6">
      <div aria-live="polite" className="mb-4 flex justify-center">
        <Chip
          size="sm"
          color={s.cpLit ? "accent" : "default"}
          variant="soft"
        >
          <span
            aria-hidden
            className={`block size-1.5 rounded-full ${s.cpLit ? "bg-glod" : "bg-muted"}`}
          />
          <Chip.Label>
            <span className="font-semibold">Control plane:</span> {s.cp}
          </Chip.Label>
        </Chip>
      </div>

      <div className="mx-auto grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-3">
        {MACHINE_IDS.map((id) => {
          const m = s.machines[id];
          const isOffline = m.tone === "danger" || m.tone === "off";
          const hasLiveSave = s.liveSaveOn === id;
          const staticCopy = !hasLiveSave;
          return (
            <div
              key={id}
              className={`flex flex-row items-center gap-3 rounded-2xl border p-3 text-left transition-colors sm:min-h-32 sm:flex-col sm:items-center sm:gap-0 sm:text-center ${
                m.tone === "ember"
                  ? "border-glod/60 bg-glod/10"
                  : isOffline
                    ? "border-separator bg-surface-200 opacity-50"
                    : "border-separator bg-surface-200"
              }`}
            >
              <motion.span
                className={`block size-2.5 shrink-0 rounded-full sm:mb-1.5 ${DOT[m.tone]}`}
                animate={
                  m.tone === "ember" ? { scale: [1, 1.4, 1] } : { scale: 1 }
                }
                transition={{ duration: 2.2, repeat: Infinity }}
              />
              <span className="flex min-w-0 flex-1 flex-col sm:items-center">
                <span className="whitespace-nowrap text-sm font-semibold text-foreground">
                  {NAMES[id]}
                </span>
                <span className="mt-0.5 whitespace-nowrap text-xs leading-tight text-muted sm:min-h-8">
                  {m.sub}
                </span>
              </span>
              <span className="ml-auto flex min-h-7 items-center sm:ml-0 sm:mt-2">
                {hasLiveSave ? (
                  <motion.span
                    layoutId="live-save"
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  >
                    <Chip
                      size="sm"
                      color={
                        id === "sara" && m.tone !== "ember"
                          ? "default"
                          : "accent"
                      }
                      variant="soft"
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
                      <Chip.Label>Live save</Chip.Label>
                    </Chip>
                  </motion.span>
                ) : staticCopy ? (
                  <Chip size="sm" variant="secondary">
                    <Chip.Label>Replica</Chip.Label>
                  </Chip>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>

      {/* All five captions share one grid cell, so the box is always the
          height of the tallest step and stepping never shifts the page. */}
      <figcaption
        aria-live="polite"
        className="mt-5 grid rounded-xl border border-separator bg-surface-200 px-4 py-3 text-center text-sm text-muted"
      >
        {STEPS.map((st, i) => (
          <span
            key={st.title}
            aria-hidden={i !== step}
            className={`col-start-1 row-start-1 transition-opacity duration-300 ${
              i === step ? "" : "invisible"
            }`}
          >
            <span className="mb-0.5 block font-semibold text-foreground">
              {st.title}
            </span>
            {st.text}
          </span>
        ))}
      </figcaption>

      <div className="mt-4 flex items-center justify-center gap-4">
        <Button
          variant="secondary"
          size="sm"
          isDisabled={step === 0}
          onPress={() => setStep((v) => Math.max(0, v - 1))}
        >
          Back
        </Button>
        <ToggleButtonGroup
          aria-label="Timeline steps"
          selectionMode="single"
          disallowEmptySelection
          isDetached
          selectedKeys={[String(step)]}
          onSelectionChange={(keys) => {
            const next = keys.values().next().value;
            if (next != null) setStep(Number(next));
          }}
          className="gap-1.5"
        >
          {STEPS.map((st, i) => (
            <ToggleButton
              key={st.title}
              id={String(i)}
              isIconOnly
              aria-label={`Step ${i + 1}: ${st.title}`}
              className="size-2 min-w-0 gap-0 rounded-full bg-surface-400 p-0 transition-colors hover:bg-muted data-[selected=true]:bg-glod data-[selected=true]:hover:bg-glod"
            />
          ))}
        </ToggleButtonGroup>
        <Button
          variant="secondary"
          size="sm"
          isDisabled={step === STEPS.length - 1}
          onPress={() => setStep((v) => Math.min(STEPS.length - 1, v + 1))}
        >
          Next
        </Button>
      </div>
    </figure>
  );
}
