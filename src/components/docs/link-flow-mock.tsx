"use client";

import { Button } from "@heroui/react";
import { motion } from "motion/react";
import { useState } from "react";

// Stylized mock of the Varde link flow: the app asks you to continue, shows a
// code, and the dashboard in your browser approves the PC. Illustrative, not
// a real screenshot. Both panes are fixed height so advancing a step never
// shifts the page below.

type Stage = "form" | "approve" | "linked";

const CODE = "K7QF-3T8B";

function PaneTitle({ children }: { children: string }) {
  return (
    <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted">
      {children}
    </p>
  );
}

const slide = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: "easeOut" as const },
};

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
        <div className="rounded-xl border border-separator bg-surface p-5">
          <PaneTitle>Varde</PaneTitle>
          <div className="flex h-56 flex-col overflow-y-auto">
            {stage === "form" && (
              <motion.div key="form" {...slide}>
                <p className="text-sm font-semibold text-foreground">
                  Set up this PC
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Varde opens your dashboard so you can approve this PC. Sign
                  up there, then join your friends with an invite link.
                </p>
                <Button
                  onPress={() => setStage("approve")}
                  className="mt-6"
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {stage === "approve" && (
              <motion.div key="code" {...slide}>
                <p className="text-sm font-semibold text-foreground">
                  Approve this PC in your browser
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Check that the browser shows this code, then approve.
                </p>
                <p className="my-4 select-all rounded-lg border border-separator bg-surface-secondary py-3 text-center font-mono text-xl font-semibold tracking-widest text-foreground">
                  {CODE}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={() => void copy()}
                    className="min-w-24"
                  >
                    {copied === "ok"
                      ? "Copied"
                      : copied === "err"
                        ? "Copy failed"
                        : "Copy code"}
                  </Button>
                  <Button
                    variant="ghost"
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
                {...slide}
                className="flex h-full flex-col justify-center"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="block size-2 rounded-full bg-success" />
                  Linked to Friday crew as This PC
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  The Varde service is running on this PC.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setStage("form")}
                  className="mt-6 w-fit"
                >
                  Replay
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* The browser tab Varde opens */}
        <div
          className={`rounded-xl border p-5 transition-colors ${
            stage === "approve"
              ? "border-glod/50 bg-surface"
              : "border-separator bg-surface"
          }`}
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="flex-1 truncate rounded-md bg-surface-secondary px-2 py-1 font-mono text-[10px] text-muted">
              varde.games/link
            </span>
          </div>
          <div className="flex h-56 flex-col overflow-y-auto">
            {stage === "approve" ? (
              <motion.div
                key="browser-approve"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.1 }}
              >
                <p className="text-sm font-semibold text-foreground">
                  Approve this PC?
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Check the code matches the one in the Varde window:
                </p>
                <p className="my-4 rounded-lg border border-glod/40 bg-glod/10 py-2.5 text-center font-mono text-lg font-semibold tracking-widest text-glod">
                  {CODE}
                </p>
                <Button onPress={() => setStage("linked")} fullWidth>
                  Approve
                </Button>
              </motion.div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="max-w-52 text-center text-xs leading-relaxed text-muted">
                  {stage === "linked"
                    ? "Done. The dashboard now shows this PC in your group."
                    : "Press Continue in the Varde window and your browser opens here."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <figcaption className="mt-4 flex min-h-10 items-start justify-center text-center text-sm text-muted">
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
