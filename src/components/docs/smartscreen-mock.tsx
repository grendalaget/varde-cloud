"use client";

import { useState } from "react";
import { motion } from "motion/react";

// Stylized Windows SmartScreen dialog. Clicking "More info" reveals "Run
// anyway", the same two clicks that get past the unsigned-installer warning.

type Stage = "warn" | "more" | "ran";

export function SmartScreenMock() {
  const [stage, setStage] = useState<Stage>("warn");

  return (
    <figure className="my-6">
      <div className="mx-auto max-w-sm rounded-xl border border-separator bg-surface-secondary p-5 shadow-xl shadow-black/30">
        <p className="text-sm font-semibold text-foreground">
          Windows protected your PC
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Microsoft Defender SmartScreen prevented an unrecognized app from
          starting. Running this app might put your PC at risk.
        </p>
        <div className="mt-3 space-y-1 text-xs">
          <p className="text-muted">
            App: <span className="text-foreground">VardeSetup.exe</span>
          </p>
          <p className="text-muted">
            Publisher: <span className="text-foreground">Unknown publisher</span>
          </p>
        </div>

        {stage === "ran" ? (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 text-xs font-medium text-success"
          >
            <span aria-hidden>✓</span> Setup launched. Varde installs and opens
            its setup window.
          </motion.p>
        ) : (
          <div className="mt-4 space-y-2">
            {stage === "warn" ? (
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStage("more")}
                  className="rounded-lg border border-separator bg-surface px-3 py-1.5 text-xs font-medium text-foreground underline-offset-2 transition-colors hover:border-border hover:underline"
                >
                  More info
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-separator bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-border"
                >
                  Don&rsquo;t run
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end gap-2"
              >
                <button
                  type="button"
                  onClick={() => setStage("ran")}
                  className="rounded-lg bg-glod px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
                >
                  Run anyway
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-separator bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-border"
                >
                  Don&rsquo;t run
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>
      <figcaption className="mt-3 text-center text-sm text-muted">
        {stage === "ran" ? (
          <button
            type="button"
            onClick={() => setStage("warn")}
            className="underline underline-offset-2 hover:text-foreground"
          >
            Replay the warning
          </button>
        ) : (
          "The warning is normal for a new, unsigned app. Click More info."
        )}
      </figcaption>
    </figure>
  );
}
