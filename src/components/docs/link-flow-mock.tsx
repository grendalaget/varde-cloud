"use client";

import { Button } from "@heroui/react";
import { motion } from "motion/react";
import { useState } from "react";

// Stylized mock of the Varde link flow: the app asks you to continue, shows a
// code, and the dashboard in your browser approves the PC. Illustrative, not
// a real screenshot.

type Stage = "form" | "approve" | "linked";

const CODE = "K7QF-3T8B";

function WindowChrome({ label }: { label: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="size-2.5 rounded-full bg-danger/70" />
      <span className="size-2.5 rounded-full bg-warning/70" />
      <span className="size-2.5 rounded-full bg-success/70" />
      <span className="ml-2 text-xs text-muted">{label}</span>
    </div>
  );
}

export function LinkFlowMock() {
  const [stage, setStage] = useState<Stage>("form");
  const [copied, setCopied] = useState<"idle" | "ok" | "err">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CODE);
      setCopied("ok");
    } catch {
      setCopied("err");
    }
    setTimeout(() => setCopied("idle"), 1500);
  };

  return (
    <figure className="my-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* The Varde window on the PC */}
        <div className="rounded-xl border border-separator bg-surface p-4 shadow-lg">
          <WindowChrome label="Varde" />
          {stage === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-sm font-semibold text-foreground">
                Set up this PC
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Varde opens your dashboard so you can approve this PC. Sign up
                there, then join your friends with an invite link.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                <span>Server: varde.games</span>
                <span className="text-glod underline underline-offset-2">
                  Use a different server
                </span>
              </div>
              <Button
                onPress={() => setStage("approve")}
                className="mt-4"
              >
                Continue
              </Button>
            </motion.div>
          )}

          {stage === "approve" && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-sm font-semibold text-foreground">
                Approve this PC in your browser
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Your browser opened Varde. Check that it shows this code, then
                approve.
              </p>
              <p className="my-3 select-all rounded-lg border border-separator bg-surface-secondary py-3 text-center font-mono text-2xl font-semibold tracking-widest text-foreground">
                {CODE}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => void copy()}
                >
                  {copied === "ok"
                    ? "Copied"
                    : copied === "err"
                      ? "Copy failed"
                      : "Copy code"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => setStage("form")}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          {stage === "linked" && (
            <motion.div
              key="linked"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <motion.span
                  className="block size-2.5 rounded-full bg-success"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                Linked
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Linked to Friday crew as This PC. The Varde service is running
                on this PC.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => setStage("form")}
                className="mt-4"
              >
                Replay
              </Button>
            </motion.div>
          )}
        </div>

        {/* The browser tab Varde opens */}
        <div
          className={`rounded-xl border p-4 transition-colors ${
            stage === "approve"
              ? "border-glod/50 bg-surface shadow-lg"
              : "border-separator bg-surface"
          }`}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-surface-tertiary" />
            <span className="flex-1 truncate rounded-md bg-surface-secondary px-2 py-1 font-mono text-[10px] text-muted">
              varde.games/link
            </span>
          </div>
          {stage === "approve" ? (
            <motion.div
              key="browser-approve"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <p className="text-sm font-semibold text-foreground">
                Approve this PC?
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Check the code matches the one in the Varde window:
              </p>
              <p className="my-3 rounded-lg border border-glod/40 bg-glod/10 py-2 text-center font-mono text-lg font-semibold tracking-widest text-glod">
                {CODE}
              </p>
              <Button onPress={() => setStage("linked")} fullWidth>
                Approve
              </Button>
            </motion.div>
          ) : (
            <div className="flex h-full min-h-24 items-center justify-center">
              <p className="text-xs text-muted">
                {stage === "linked"
                  ? "Done. The dashboard now shows this PC in your group."
                  : "Press Continue in the Varde window and your browser opens here."}
              </p>
            </div>
          )}
        </div>
      </div>
      <figcaption className="mt-4 text-center text-sm text-muted">
        {stage === "form" &&
          "Try it: press Continue, the same thing the real installer does."}
        {stage === "approve" &&
          "The app shows a code, the browser asks you to approve it."}
        {stage === "linked" &&
          "That is the whole link: your PC is part of the group now."}
      </figcaption>
    </figure>
  );
}
