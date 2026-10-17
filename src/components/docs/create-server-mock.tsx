"use client";

import {
  Button,
  Input,
  Label,
  ListBox,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextField,
} from "@heroui/react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import {
  AutoHeight,
  cpFetch,
  CreateGroupInline,
  GroupField,
  LiveHint,
  useDocsCp,
  type CpGroup,
} from "./live-primitives";

// The dashboard "New server" form. Signed-in readers get the real thing —
// it creates an actual server in their group on the hosted control plane.
// Everyone else sees a static illustration plus a quiet sign-in hint. The
// stage area resizes to its content with an animated height transition.

interface CatalogGame {
  id: string;
  name: string;
  min_memory_mb?: number;
}

interface CpNode {
  id: string;
  name: string;
  online?: boolean;
}

interface CreatedServer {
  id: string;
  name: string;
  game_id: string;
  desired_state: string;
  observed_state: string;
  service?: { loopback_ip: string } | null;
}

const FALLBACK_GAMES: CatalogGame[] = [
  { id: "minecraft", name: "Minecraft (Java)", min_memory_mb: 2048 },
  { id: "valheim", name: "Valheim Dedicated", min_memory_mb: 2048 },
];

type Stage = "form" | "created";

export function CreateServerMock() {
  const { status, groups, refresh } = useDocsCp();
  const live = status === "live";

  const [stage, setStage] = useState<Stage>("form");
  const [games, setGames] = useState<CatalogGame[]>(FALLBACK_GAMES);
  const [game, setGame] = useState<string>("minecraft");
  const [name, setName] = useState("Friday night server");
  const [groupId, setGroupId] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [nodesData, setNodesData] = useState<{
    groupId: string;
    nodes: CpNode[];
  } | null>(null);
  const [startNow, setStartNow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    server: CreatedServer;
    nodeName: string | null;
    startError: string | null;
  } | null>(null);
  const [copied, setCopied] = useState<"idle" | "ok" | "err">("idle");

  const group: CpGroup | undefined =
    groups.find((g) => g.id === groupId) ?? groups[0];

  // Live mode: real catalog + real machines of the picked group.
  useEffect(() => {
    if (!live) return;
    void (async () => {
      try {
        const d = await cpFetch<{ games: CatalogGame[] }>("/api/cp/games");
        const real = d.games.filter((g) => g.id !== "testgame");
        if (real.length) {
          setGames(real);
          setGame((cur) => (real.some((g) => g.id === cur) ? cur : real[0].id));
        }
      } catch {}
    })();
  }, [live]);

  useEffect(() => {
    if (!live || !group) return;
    const gid = group.id;
    void (async () => {
      try {
        const d = await cpFetch<{ nodes: CpNode[] }>(
          `/api/cp/groups/${encodeURIComponent(gid)}/nodes`,
        );
        setNodesData({ groupId: gid, nodes: d.nodes });
      } catch {
        setNodesData({ groupId: gid, nodes: [] });
      }
    })();
  }, [live, group]);

  const nodes =
    group && nodesData?.groupId === group.id ? nodesData.nodes : [];
  // A stale pick from another group reads as "any machine".
  const validNodeId = nodes.some((n) => n.id === nodeId) ? nodeId : "";

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("ok");
    } catch {
      setCopied("err");
    }
    setTimeout(() => setCopied("idle"), 1500);
  };

  const create = async () => {
    if (!group) return;
    setBusy(true);
    setErr(null);
    try {
      const data = await cpFetch<{
        server: CreatedServer;
        startError: string | null;
      }>(`/api/cp/groups/${encodeURIComponent(group.id)}/servers`, {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          game_id: game,
          start: startNow,
          ...(validNodeId ? { preferred_node_id: validNodeId } : {}),
        }),
      });
      setCreated({
        server: data.server,
        nodeName: nodes.find((n) => n.id === validNodeId)?.name ?? null,
        startError: data.startError,
      });
      setStage("created");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create the server");
    } finally {
      setBusy(false);
    }
  };

  const address = created?.server.service?.loopback_ip ?? null;
  const running =
    !created?.startError &&
    (created?.server.desired_state === "running" ||
      created?.server.observed_state === "running");

  return (
    <figure className="my-8">
      <div className="rounded-xl border border-separator bg-surface p-5">
        <AutoHeight>
          {stage === "created" && created ? (
            <motion.div
              key="created"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {created.server.name}
                </p>
                {running ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
                    <span
                      aria-hidden
                      className="size-1.5 rounded-full bg-success"
                    />
                    Starting
                  </span>
                ) : (
                  <span className="text-xs font-medium text-muted">
                    Not running
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted">
                {games.find((g) => g.id === created.server.game_id)?.name ??
                  created.server.game_id}
              </p>
              <p className="mt-2 text-xs text-muted">
                {running
                  ? "A linked machine in your group picks it up and starts it, usually within a minute."
                  : created.startError
                    ? `Created, but it couldn't start yet: ${created.startError}. Start it from the dashboard when a machine is online.`
                    : "Created but not started yet. Start it from the dashboard when you are ready."}
              </p>
              <div className="mt-5 rounded-lg border border-separator bg-surface-secondary p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  Connect
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted">Address</span>
                  {address ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onPress={() => void copy(address)}
                      className="min-w-28 font-mono text-xs"
                    >
                      {address}
                      {copied === "ok" ? " ✓" : copied === "err" ? " ×" : " ⧉"}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted">
                      Appears once the server starts
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted">Hosting on</span>
                  <span className="flex items-center gap-1.5 text-xs text-foreground">
                    <span aria-hidden className="size-2 rounded-sm bg-glod" />
                    {created.nodeName ?? "Any machine in the group"}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setStage("form")}
                className="mt-5 w-fit underline underline-offset-2"
              >
                Back to the form
              </Button>
            </motion.div>
          ) : (
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-foreground">New server</p>

              {live && groups.length === 0 ? (
                <div className="mt-5">
                  <CreateGroupInline
                    onCreated={() => {
                      refresh();
                    }}
                  />
                </div>
              ) : (
                <>
                  {live ? (
                    <div className="mt-5">
                      <GroupField
                        groups={groups}
                        value={group?.id ?? ""}
                        onChange={setGroupId}
                      />
                    </div>
                  ) : null}

                  <RadioGroup
                    value={game}
                    onChange={setGame}
                    aria-label="Game"
                    className="mt-5"
                    isDisabled={!live}
                  >
                    <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                      Game
                    </Label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {games.map((g) => (
                        <Radio
                          key={g.id}
                          value={g.id}
                          className="rounded-lg border border-separator bg-surface-secondary px-4 py-3 data-[selected=true]:border-glod data-[selected=true]:bg-glod/10"
                        >
                          <Radio.Content>
                            <Radio.Control>
                              <Radio.Indicator />
                            </Radio.Control>
                            <span>
                              <span className="block text-xs font-semibold text-foreground">
                                {g.name}
                              </span>
                              <span className="mt-0.5 block text-[11px] text-muted">
                                {g.min_memory_mb
                                  ? `Needs ${Math.max(1, Math.round(g.min_memory_mb / 1024))} GB RAM`
                                  : ""}
                              </span>
                            </span>
                          </Radio.Content>
                        </Radio>
                      ))}
                    </div>
                  </RadioGroup>

                  <div className="mt-5 space-y-4">
                    <TextField
                      name="serverName"
                      value={name}
                      onChange={setName}
                      className="w-full"
                      isDisabled={!live}
                    >
                      <Label>Server name</Label>
                      <Input />
                    </TextField>
                    <Select
                      selectedKey={validNodeId || "any"}
                      onSelectionChange={(k) =>
                        setNodeId(k === "any" ? "" : String(k))
                      }
                      className="w-full"
                      isDisabled={!live}
                    >
                      <Label>Preferred machine</Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          <ListBox.Item id="any">Any machine</ListBox.Item>
                          {(live ? nodes : [{ id: "this", name: "This PC" }]).map(
                            (n) => (
                              <ListBox.Item key={n.id} id={n.id}>
                                {n.name}
                                {"online" in n && !n.online
                                  ? " (offline)"
                                  : ""}
                              </ListBox.Item>
                            ),
                          )}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                    <Switch
                      isSelected={startNow}
                      onChange={setStartNow}
                      isDisabled={!live}
                    >
                      <Switch.Content>
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <span className="text-xs text-foreground">
                          Start now
                        </span>
                      </Switch.Content>
                    </Switch>
                  </div>

                  {err ? (
                    <p className="mt-3 text-xs text-danger">{err}</p>
                  ) : null}

                  <div className="mt-6 flex justify-end gap-2 pt-5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => {
                        setGame(games[0]?.id ?? "minecraft");
                        setName("Friday night server");
                        setNodeId("");
                        setStartNow(true);
                      }}
                      isDisabled={!live}
                    >
                      Cancel
                    </Button>
                    <Button
                      onPress={() => {
                        if (live) void create();
                      }}
                      isDisabled={!live || busy || !name.trim()}
                    >
                      {busy ? "Creating" : "Create server"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </AutoHeight>
      </div>
      <figcaption className="mt-4 flex min-h-10 items-start justify-center text-center text-sm text-muted">
        {stage === "created" && created
          ? `Done, that's a real server in ${group?.name ?? "your group"}.`
          : live
            ? "Signed in: this creates a real server in your group."
            : "The dashboard's New server form."}
      </figcaption>
      <LiveHint status={status} />
    </figure>
  );
}
