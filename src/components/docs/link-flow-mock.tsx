"use client";

import { Button, Input, Label, TextField } from "@heroui/react";
import { motion } from "motion/react";
import { useState } from "react";

import {
  cpFetch,
  CreateGroupInline,
  GroupField,
  LiveHint,
  useDocsCp,
} from "./live-primitives";

// The Varde link flow: the app asks to continue, shows a code, and the
// browser approves the PC. For a signed-in reader the right pane is the real
// approver — paste the code the app shows and it links their machine for
// real. Signed-out visitors get the static illustration plus a sign-in hint.

type Stage = "form" | "approve" | "linked";

const CODE = "K7QF-3T8B";

interface DeviceLink {
  user_code: string;
  hostname: string;
  os: string;
  arch: string;
  state: "pending" | "approved" | "consumed" | "expired";
}

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
  const { status, groups, refresh } = useDocsCp();
  const live = status === "live";

  const [stage, setStage] = useState<Stage>("form");
  const [copied, setCopied] = useState<"idle" | "ok" | "err">("idle");

  // Live approve state
  const [code, setCode] = useState("");
  const [link, setLink] = useState<DeviceLink | null>(null);
  const [groupId, setGroupId] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [approved, setApproved] = useState<{
    group: string;
    name: string;
  } | null>(null);

  const group = groups.find((g) => g.id === groupId) ?? groups[0];

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("ok");
    } catch {
      setCopied("err");
    }
    setTimeout(() => setCopied("idle"), 1500);
  };

  const lookup = async () => {
    const c = code.trim();
    if (!c) return;
    setBusy(true);
    setErr(null);
    try {
      const data = await cpFetch<{ link: DeviceLink }>(
        `/api/cp/device-links/${encodeURIComponent(c)}`,
      );
      if (data.link.state !== "pending") {
        setErr(`That code is ${data.link.state}, ask the app for a fresh one.`);
        return;
      }
      setLink(data.link);
      setName(data.link.hostname || "This PC");
    } catch (e) {
      setErr(
        e instanceof Error ? e.message : "Could not find that code",
      );
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    if (!link || !group) return;
    setBusy(true);
    setErr(null);
    try {
      await cpFetch("/api/cp/device-links/approve", {
        method: "POST",
        body: JSON.stringify({
          user_code: link.user_code,
          group_id: group.id,
          name: name.trim() || link.hostname,
        }),
      });
      setApproved({ group: group.name, name: name.trim() || link.hostname });
      setLink(null);
      setCode("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not approve this PC");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setLink(null);
    setApproved(null);
    setCode("");
    setErr(null);
  };

  return (
    <figure className="my-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* The Varde window on the PC — always illustrative, we can't drive
            the reader's app from here. */}
        <div className="rounded-xl border border-separator bg-surface p-5">
          <PaneTitle>Varde</PaneTitle>
          <div className="flex h-56 flex-col overflow-y-auto">
            {live ? (
              <motion.div key="app" {...slide}>
                <p className="text-sm font-semibold text-foreground">
                  Approve this PC in your browser
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  The app on your PC shows a code like this one:
                </p>
                <p className="my-4 select-all rounded-lg border border-separator bg-surface-secondary py-3 text-center font-mono text-xl font-semibold tracking-widest text-foreground">
                  {CODE}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={() => void copy(CODE)}
                    className="min-w-24"
                  >
                    {copied === "ok"
                      ? "Copied"
                      : copied === "err"
                        ? "Copy failed"
                        : "Copy code"}
                  </Button>
                </div>
              </motion.div>
            ) : stage === "form" ? (
              <motion.div key="form" {...slide}>
                <p className="text-sm font-semibold text-foreground">
                  Set up this PC
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Varde opens your dashboard so you can approve this PC. Sign
                  up there, then join your friends with an invite link.
                </p>
                <Button
                  variant="secondary"
                  onPress={() => setStage("approve")}
                  className="mt-6"
                >
                  Continue
                </Button>
              </motion.div>
            ) : stage === "approve" ? (
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
                    onPress={() => void copy(CODE)}
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
            ) : (
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

        {/* The browser pane — real approver when signed in. */}
        <div
          className={`rounded-xl border p-5 transition-colors ${
            live || stage === "approve"
              ? "border-glod/50 bg-surface"
              : "border-separator bg-surface"
          }`}
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="flex-1 truncate rounded-md bg-surface-secondary px-2 py-1 font-mono text-[10px] text-muted">
              {live ? "varde.games | approve a PC" : "varde.games/link"}
            </span>
          </div>
          <div className="flex h-56 flex-col overflow-y-auto">
            {live ? (
              approved ? (
                <motion.div
                  key="approved"
                  {...slide}
                  className="flex h-full flex-col justify-center"
                >
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span className="block size-2 rounded-full bg-success" />
                    Linked to {approved.group} as {approved.name}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    The Varde service on that PC finishes linking itself.
                    Nothing left to do here.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={reset}
                    className="mt-6 w-fit"
                  >
                    Approve another PC
                  </Button>
                </motion.div>
              ) : link ? (
                <motion.div key="confirm" {...slide}>
                  <p className="text-sm font-semibold text-foreground">
                    Approve this PC?
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    The code matches a real machine asking to join:
                  </p>
                  <div className="my-3 rounded-lg border border-glod/40 bg-glod/10 px-3 py-2.5 text-xs">
                    <p className="font-semibold text-foreground">
                      {link.hostname}
                    </p>
                    <p className="mt-0.5 text-muted">
                      {link.os}, {link.arch}, code {link.user_code}
                    </p>
                  </div>
                  {groups.length === 0 ? (
                    <CreateGroupInline onCreated={() => refresh()} />
                  ) : (
                    <>
                      <GroupField
                        groups={groups}
                        value={group?.id ?? ""}
                        onChange={setGroupId}
                      />
                      <TextField
                        name="machineName"
                        value={name}
                        onChange={setName}
                        className="mt-3 w-full"
                      >
                        <Label>Name in the group</Label>
                        <Input />
                      </TextField>
                      {err ? (
                        <p className="mt-3 text-xs text-danger">{err}</p>
                      ) : null}
                      <div className="mt-4 flex gap-2">
                        <Button
                          onPress={() => void approve()}
                          isDisabled={busy}
                          className="flex-1"
                        >
                          {busy ? "Approving" : "Approve"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => {
                            setLink(null);
                            setErr(null);
                          }}
                        >
                          Back
                        </Button>
                      </div>
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div key="enter" {...slide}>
                  <p className="text-sm font-semibold text-foreground">
                    Approve this PC?
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    Type the code your Varde window is showing right now.
                  </p>
                  <TextField
                    name="linkCode"
                    value={code}
                    onChange={setCode}
                    className="mt-4 w-full"
                  >
                    <Label>Code</Label>
                    <Input placeholder="K7QF-3T8B" />
                  </TextField>
                  {err ? (
                    <p className="mt-2 text-xs text-danger">{err}</p>
                  ) : null}
                  <Button
                    onPress={() => void lookup()}
                    isDisabled={busy || !code.trim()}
                    className="mt-4"
                    fullWidth
                  >
                    {busy ? "Checking" : "Check code"}
                  </Button>
                </motion.div>
              )
            ) : stage === "approve" ? (
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
        {live
          ? approved
            ? "Linked for real, that PC is part of your group now."
            : "Signed in: approving here really links your PC."
          : stage === "form"
            ? "Try it: press Continue, the same thing the real installer does."
            : stage === "approve"
              ? "The app shows a code, the browser asks you to approve it."
              : "That is the whole link: your PC is part of the group now."}
      </figcaption>
      <LiveHint status={status} />
    </figure>
  );
}
