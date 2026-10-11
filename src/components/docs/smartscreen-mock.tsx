"use client";

import { Button } from "@heroui/react";
import { motion } from "motion/react";
import { useState } from "react";

// Stylized Windows SmartScreen dialog. Clicking "More info" reveals "Run
// anyway", the same two clicks that get past the unsigned-installer warning.
// The action area is fixed height so advancing the step never reflows the
// page below.

type Stage = "warn" | "more" | "ran";

export function SmartScreenMock() {
  const [stage, setStage] = useState<Stage>("warn");

  return (
    <figure className="my-6">
      <div className="mx-auto max-w-sm rounded-xl border border-separator bg-surface-secondary p-5 shadow-xl">
        <p className="text-sm font-semibold text-foreground">
          Windows protected your PC
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Microsoft Defender SmartScreen prevented an unrecognized app from
          starting. Running this app might put your PC at risk.
        </p>
        <p className="mt-3 text-xs text-muted">
          App: <span className="text-foreground">VardeSetup.exe</span>
          <span className="mx-2 text-muted/50">·</span>
          Publisher: <span className="text-foreground">Unknown publisher</span>
        </p>

        <div className="mt-5 flex h-10 items-center justify-end">
          {stage === "ran" ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2 text-xs font-medium text-success"
            >
              <span aria-hidden>✓</span> Setup launched. Varde installs and
              opens its setup window.
            </motion.p>
          ) : stage === "warn" ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onPress={() => setStage("more")}
                className="underline-offset-2 hover:underline"
              >
                More info
              </Button>
              <Button variant="secondary" size="sm" isDisabled>
                Don&rsquo;t run
              </Button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="flex gap-2"
            >
              <Button size="sm" onPress={() => setStage("ran")}>
                Run anyway
              </Button>
              <Button variant="secondary" size="sm" isDisabled>
                Don&rsquo;t run
              </Button>
            </motion.div>
          )}
        </div>
      </div>
      <figcaption className="mt-3 flex h-8 items-center justify-center text-center text-sm text-muted">
        {stage === "ran" ? (
          <Button
            variant="ghost"
            size="sm"
            onPress={() => setStage("warn")}
            className="underline underline-offset-2"
          >
            Replay the warning
          </Button>
        ) : (
          "The warning is normal for a new, unsigned app. Click More info."
        )}
      </figcaption>
    </figure>
  );
}
