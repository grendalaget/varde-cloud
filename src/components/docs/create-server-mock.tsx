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
import { useState } from "react";

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
  const [copied, setCopied] = useState<"idle" | "ok" | "err">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText("127.77.4.20");
      setCopied("ok");
    } catch {
      setCopied("err");
    }
    setTimeout(() => setCopied("idle"), 1500);
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
            {startNow ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
                <span aria-hidden className="size-1.5 rounded-full bg-success" />
                Running
              </span>
            ) : (
              <span className="text-xs font-medium text-muted">
                Not running
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {GAMES.find((g) => g.id === game)?.name}
          </p>
          {!startNow && (
            <p className="mt-2 text-xs text-muted">
              Start now was off, so it is created but not started yet. Start
              it from the dashboard when you are ready.
            </p>
          )}
          <div className="mt-4 rounded-lg border border-separator bg-surface-secondary p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Connect
            </p>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted">Address</span>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => void copy()}
                className="font-mono text-xs"
              >
                127.77.4.20
                {copied === "ok" ? " ✓" : copied === "err" ? " ×" : " ⧉"}
              </Button>
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
          <Button
            variant="ghost"
            size="sm"
            onPress={() => setStage("form")}
            className="mt-4 underline underline-offset-2"
          >
            Back to the form
          </Button>
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

        <RadioGroup
          value={game}
          onChange={setGame}
          aria-label="Game"
          className="mt-4"
        >
          <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
            Game
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {GAMES.map((g) => (
              <Radio
                key={g.id}
                value={g.id}
                className="items-start rounded-lg border border-separator bg-surface-secondary px-3 py-2.5 data-[selected=true]:border-glod data-[selected=true]:bg-glod/10"
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
                      {g.ram}
                    </span>
                  </span>
                </Radio.Content>
              </Radio>
            ))}
          </div>
        </RadioGroup>

        <div className="mt-4 space-y-3">
          <TextField
            name="serverName"
            value={name}
            onChange={setName}
            className="w-full"
          >
            <Label>Server name</Label>
            <Input />
          </TextField>
          <Select
            selectedKey={machine || "any"}
            onSelectionChange={(k) =>
              setMachine(k === "any" ? "" : String(k))
            }
            className="w-full"
          >
            <Label>Preferred machine</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="any">Any machine</ListBox.Item>
                <ListBox.Item id="This PC">This PC</ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
          <Switch isSelected={startNow} onChange={setStartNow}>
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <span className="text-xs text-foreground">Start now</span>
            </Switch.Content>
          </Switch>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onPress={() => {
              setGame("minecraft");
              setName("Friday night server");
              setMachine("");
              setStartNow(true);
            }}
          >
            Cancel
          </Button>
          <Button onPress={() => setStage("created")}>Create server</Button>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm text-muted">
        Try it: pick a game and press Create server.
      </figcaption>
    </figure>
  );
}
