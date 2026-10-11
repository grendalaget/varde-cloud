"use client";

import { useState } from "react";
import { motion } from "motion/react";

// Stylized mock of the dashboard "New server" form: pick a game, name it,
// create. The result card mirrors what the dashboard shows afterwards.

const GAMES = [
  { id: "minecraft", name: "Minecraft (Java)", ram: "Needs 2 GB RAM" },
  { id: "valheim", name: "Valheim Dedicated", ram: "Needs 2 GB RAM" },
] as const;

type Stage = "form" | "created";

export function CreateServerMock() {
  const [stage, setStage] = useState<Stage>("form");
  const [game, setGame] = useState<string>("minecraft");
  const [name, setName] = useState("Friday night server");
  const [machine, setMachine] = useState("");
  const [startNow, setStartNow] = useState(true);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText("127.77.4.20");
    } catch {
      // clipboard is best effort in a mock
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (stage === "created") {
    return (
      <figure className="my-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-xl border border-separator bg-surface p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">
              {name.trim() || "Friday night server"}
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
              <span aria-hidden className="size-1.5 rounded-full bg-success" />
              Running
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {GAMES.find((g) => g.id === game)?.name}
          </p>
          <div className="mt-4 rounded-lg border border-separator bg-surface-secondary p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Connect
            </p>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted">Address</span>
              <button
                type="button"
                onClick={() => void copy()}
                className="rounded-md border border-separator bg-surface px-2 py-1 font-mono text-xs text-foreground transition-colors hover:border-border"
                title="Copy address"
              >
                127.77.4.20{copied ? " ✓" : " ⧉"}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-muted">Hosting on</span>
              <span className="flex items-center gap-1.5 text-xs text-foreground">
                <span
                  aria-hidden
                  className="size-2 rounded-sm bg-glod"
                />
                {machine || "This PC"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStage("form")}
            className="mt-4 text-xs text-muted underline underline-offset-2 hover:text-foreground"
          >
            Back to the form
          </button>
        </motion.div>
        <figcaption className="mt-3 text-center text-sm text-muted">
          The address is what your friends paste into their game.
        </figcaption>
      </figure>
    );
  }

  return (
    <figure className="my-8">
      <div className="rounded-xl border border-separator bg-surface p-5">
        <p className="text-sm font-semibold text-foreground">New server</p>

        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-muted">
          Game
        </p>
        <div className="grid grid-cols-2 gap-2">
          {GAMES.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={game === g.id}
              onClick={() => setGame(g.id)}
              className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                game === g.id
                  ? "border-glod bg-glod/10"
                  : "border-separator bg-surface-secondary hover:border-border"
              }`}
            >
              <span className="block text-xs font-semibold text-foreground">
                {g.name}
              </span>
              <span className="mt-0.5 block text-[11px] text-muted">
                {g.ram}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">
              Server name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-field px-3 py-2 text-sm text-foreground outline-none focus:border-glod"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">
              Preferred machine
            </span>
            <select
              value={machine}
              onChange={(e) => setMachine(e.target.value)}
              className="w-full rounded-lg border border-border bg-field px-3 py-2 text-sm text-foreground outline-none focus:border-glod"
            >
              <option value="">Any machine</option>
              <option value="This PC">This PC</option>
            </select>
          </label>
          <button
            type="button"
            role="switch"
            aria-checked={startNow}
            onClick={() => setStartNow(!startNow)}
            className="flex items-center gap-2.5"
          >
            <span
              aria-hidden
              className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
                startNow ? "bg-glod" : "bg-surface-tertiary"
              }`}
            >
              <span
                className={`size-4 rounded-full bg-take transition-transform ${
                  startNow ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </span>
            <span className="text-xs text-foreground">Start now</span>
          </button>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setGame("minecraft");
              setName("Friday night server");
              setMachine("");
              setStartNow(true);
            }}
            className="rounded-lg px-3 py-2 text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setStage("created")}
            className="rounded-lg bg-glod px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            Create server
          </button>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm text-muted">
        Try it: pick a game and press Create server.
      </figcaption>
    </figure>
  );
}
