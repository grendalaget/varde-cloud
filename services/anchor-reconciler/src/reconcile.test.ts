import assert from "node:assert/strict";
import { test } from "node:test";

import { AnchorDb, type AnchorRow } from "./db";
import type { CpClient, CpNode } from "./cp";
import type { AnchorMachine, AnchorProvider, AnchorVolume } from "./provider";
import { reconcile, sweepVolumes } from "./reconcile";
import { volumeName } from "./names";

const row = (p: Partial<AnchorRow> = {}): AnchorRow => ({
  id: "ca_1",
  user_id: "u1",
  group_id: "grp_1",
  desired: "provisioned",
  status: "online",
  fly_machine_id: "m1",
  fly_volume_id: "v1",
  node_id: "n1",
  error: null,
  attempts: 0,
  created_at: Date.now(),
  updated_at: Date.now(),
  plan: "anchor",
  email: "sub@example.com",
  ...p,
});

// In-memory fakes: record what reconcile asked the outside world to do.
function fakes(
  opts: {
    nodes?: CpNode[];
    nodeResponses?: CpNode[][];
    machine?: AnchorMachine | null;
    blockers?: string[];
    groupAdmin?: boolean;
    destroyError?: Error;
    expiredRows?: AnchorRow[];
    volumeInUse?: boolean;
    volumes?: AnchorVolume[];
    activeGroupIds?: string[];
    allVolumes?: (AnchorVolume & { name: string })[];
    listVolumesError?: Error;
    findVolumesError?: Error;
    claimSwept?: boolean;
    deleteVolumeError?: Error;
  } = {},
) {
  const statuses: string[] = [];
  const statusWrites: { id: string; status: string; patch: Record<string, unknown> }[] = [];
  const claimSweptCalls: { id: string; observedUpdatedAt: number }[] = [];
  const unclaimSweptCalls: { id: string; originalUpdatedAt: number }[] = [];
  const destroyed: string[] = [];
  const volumesDeleted: string[] = [];
  const volumeDeleteAttempts: string[] = [];
  let findVolumesCalls = 0;
  const calls = { db: 0, cp: 0, provider: 0 };
  let nodePass = 0;
  const db = {
    setStatus: async (id: string, status: string, patch: Record<string, unknown> = {}) => {
      calls.db++;
      statuses.push(status);
      statusWrites.push({ id, status, patch });
    },
    expiredTeardowns: async () => opts.expiredRows ?? [],
    activeGroupIds: async () => opts.activeGroupIds ?? [],
    volumeInUse: async () => opts.volumeInUse ?? false,
    claimSwept: async (id: string, observedUpdatedAt: number) => {
      calls.db++;
      claimSweptCalls.push({ id, observedUpdatedAt });
      return opts.claimSwept ?? true;
    },
    unclaimSwept: async (id: string, originalUpdatedAt: number) => {
      calls.db++;
      unclaimSweptCalls.push({ id, originalUpdatedAt });
    },
    liveSiblingAnchor: async () => {
      calls.db++;
      return null;
    },
    machineClaimed: async () => {
      calls.db++;
      return false;
    },
    outrankingAnchorsOfUser: async () => {
      calls.db++;
      return opts.blockers ?? [];
    },
  } as unknown as AnchorDb;
  const cp = {
    isGroupAdmin: async () => {
      calls.cp++;
      return opts.groupAdmin ?? true;
    },
    listNodes: async () => {
      calls.cp++;
      const nodes = opts.nodeResponses?.[nodePass] ?? opts.nodes ?? [];
      nodePass++;
      return { nodes };
    },
    deleteNode: async () => {},
  } as unknown as CpClient;
  const created: string[] = [];
  const provider = {
    find: async () => {
      calls.provider++;
      return opts.machine ?? null;
    },
    findVolumes: async () => {
      calls.provider++;
      findVolumesCalls++;
      if (opts.findVolumesError) throw opts.findVolumesError;
      return opts.volumes ?? [];
    },
    listVolumes: async () => {
      calls.provider++;
      if (opts.listVolumesError) throw opts.listVolumesError;
      return opts.allVolumes ?? [];
    },
    create: async (spec: { name: string }) => {
      calls.provider++;
      created.push(spec.name);
      return { id: "m2", volumeId: "v1", status: "created" };
    },
    destroy: async (id: string) => {
      calls.provider++;
      destroyed.push(id);
      if (opts.destroyError) throw opts.destroyError;
    },
    deleteVolume: async (id: string) => {
      calls.provider++;
      volumeDeleteAttempts.push(id);
      if (opts.deleteVolumeError) throw opts.deleteVolumeError;
      volumesDeleted.push(id);
    },
  } satisfies AnchorProvider;
  return {
    db,
    cp,
    provider,
    statuses,
    statusWrites,
    claimSweptCalls,
    unclaimSweptCalls,
    destroyed,
    volumesDeleted,
    volumeDeleteAttempts,
    findVolumesCalls,
    created,
    calls,
  };
}

test("a parked row whose plan lapsed is still torn down", async () => {
  const f = fakes({ machine: { id: "m1", rowId: "ca_1", status: "started" } });
  const r = row({
    status: "error",
    error: "boom",
    attempts: 50,
    plan: "free",
    updated_at: Date.now() - 60 * 60_000,
  });
  await reconcile(r, f.db, f.cp, f.provider);
  assert.deepEqual(f.destroyed, ["m1"]);
  assert.deepEqual(f.statuses, ["deprovisioning"]);
});

test("a parked row that still wants its anchor is left alone", async () => {
  const f = fakes();
  await reconcile(row({ status: "error", error: "boom", attempts: 50 }), f.db, f.cp, f.provider);
  assert.deepEqual(f.statuses, []);
});

test("a stuck provision rebuilds the machine but keeps the volume", async () => {
  const f = fakes();
  const r = row({ status: "provisioning", node_id: null, updated_at: Date.now() - 31 * 60_000 });
  await reconcile(r, f.db, f.cp, f.provider);
  assert.deepEqual(f.destroyed, ["m1"]);
  assert.deepEqual(f.volumesDeleted, []);
  assert.deepEqual(f.statuses, ["error"]);
});

test("an online anchor waits for four consecutive offline observations", async () => {
  const f = fakes({ nodes: [{ id: "n1", name: "m1", anchor: true, online: false }] });
  const r = row({ id: "ca_offline_streak" });
  for (let i = 0; i < 3; i++) await reconcile(r, f.db, f.cp, f.provider);
  assert.deepEqual(f.statuses, []);
  await reconcile(r, f.db, f.cp, f.provider);
  assert.deepEqual(f.statuses, ["provisioning"]);
});

test("an online observation resets the offline streak", async () => {
  const offline = [{ id: "n1", name: "m1", anchor: true, online: false }];
  const online = [{ id: "n1", name: "m1", anchor: true, online: true }];
  const f = fakes({ nodeResponses: [offline, offline, online, offline, offline, offline, offline] });
  const r = row({ id: "ca_offline_reset" });
  for (let i = 0; i < 6; i++) await reconcile(r, f.db, f.cp, f.provider);
  assert.deepEqual(f.statuses, []);
  await reconcile(r, f.db, f.cp, f.provider);
  assert.deepEqual(f.statuses, ["provisioning"]);
});

test("an error row with unknown billing intent is backed off", async () => {
  const f = fakes();
  await reconcile(
    row({ id: "ca_error_unknown", status: "error", attempts: 10, updated_at: Date.now() }),
    f.db,
    f.cp,
    f.provider,
  );
  assert.deepEqual(f.calls, { db: 0, cp: 0, provider: 0 });
});

test("a plan lapse tears down despite a fresh provision error backoff", async () => {
  const id = "ca_error_plan_lapse";
  const primer = fakes();
  await reconcile(
    row({ id, status: "pending", fly_machine_id: null, node_id: null }),
    primer.db,
    primer.cp,
    primer.provider,
  );
  assert.equal(primer.created.length, 1);

  const f = fakes({
    machine: { id: "m1", rowId: id, status: "started" },
  });
  await reconcile(
    row({ id, status: "error", plan: "free", attempts: 1, updated_at: Date.now() }),
    f.db,
    f.cp,
    f.provider,
  );
  assert.deepEqual(f.destroyed, ["m1"]);
  assert.deepEqual(f.statuses, ["deprovisioning"]);
});

test("a paid subscriber losing admin backs off a teardown error", async () => {
  const id = "ca_error_admin_lost";
  const first = fakes({
    groupAdmin: false,
    destroyError: new Error("destroy failed"),
  });
  await assert.rejects(
    reconcile(row({ id, status: "online" }), first.db, first.cp, first.provider),
    /destroy failed/,
  );

  const next = fakes();
  await reconcile(
    row({ id, status: "error", attempts: 10, updated_at: Date.now() }),
    next.db,
    next.cp,
    next.provider,
  );
  assert.deepEqual(next.calls, { db: 0, cp: 0, provider: 0 });
});

test("a recent error row is backed off after the same direction was attempted", async () => {
  const id = "ca_error_recent";
  const primer = fakes();
  await reconcile(
    row({ id, status: "pending", fly_machine_id: null, node_id: null }),
    primer.db,
    primer.cp,
    primer.provider,
  );

  const f = fakes();
  await reconcile(
    row({ id, status: "error", attempts: 10, updated_at: Date.now() }),
    f.db,
    f.cp,
    f.provider,
  );
  assert.deepEqual(f.calls, { db: 0, cp: 0, provider: 0 });
});

test("an old error row proceeds after the backoff window", async () => {
  const f = fakes();
  await reconcile(
    row({ id: "ca_error_old", status: "error", attempts: 10, updated_at: Date.now() - 60 * 60_000 }),
    f.db,
    f.cp,
    f.provider,
  );
  assert.deepEqual(f.statuses, ["pending"]);
  assert.ok(f.calls.cp > 0);
});

test("volume sweep claims before deleting every unattached same-name volume", async () => {
  const r = row({
    id: "ca_sweep_delete",
    status: "deprovisioning",
    updated_at: Date.now() - 15 * 24 * 60 * 60_000,
  });
  const f = fakes({
    expiredRows: [r],
    volumes: [{ id: "vol_a" }, { id: "vol_b" }],
  });
  await sweepVolumes(f.db, f.provider);
  assert.deepEqual(f.volumesDeleted, ["vol_a", "vol_b"]);
  assert.deepEqual(f.claimSweptCalls, [{ id: r.id, observedUpdatedAt: r.updated_at }]);
  assert.deepEqual(f.statusWrites, []);
  assert.deepEqual(f.unclaimSweptCalls, []);
});

test("volume sweep claims without deleting when a sibling is still using the volume", async () => {
  const r = row({ id: "ca_sweep_sibling", status: "deprovisioning" });
  const f = fakes({ expiredRows: [r], volumeInUse: true });
  await sweepVolumes(f.db, f.provider);
  assert.deepEqual(f.claimSweptCalls, [{ id: r.id, observedUpdatedAt: r.updated_at }]);
  assert.deepEqual(f.volumesDeleted, []);
  assert.equal(f.findVolumesCalls, 0);
  assert.deepEqual(f.statusWrites, []);
});

test("volume sweep leaves an attached volume and row untouched", async () => {
  const r = row({ id: "ca_sweep_attached", status: "deprovisioning" });
  const f = fakes({ expiredRows: [r], volumes: [{ id: "vol_attached", attachedMachineId: "m1" }] });
  await sweepVolumes(f.db, f.provider);
  assert.deepEqual(f.volumesDeleted, []);
  assert.deepEqual(f.claimSweptCalls, []);
  assert.deepEqual(f.statusWrites, []);
});

test("volume sweep leaves the row untouched when volume lookup fails", async () => {
  const r = row({ id: "ca_sweep_lookup_error", status: "deprovisioning" });
  const f = fakes({ expiredRows: [r], findVolumesError: new Error("provider unavailable") });
  await sweepVolumes(f.db, f.provider);
  assert.deepEqual(f.claimSweptCalls, []);
  assert.deepEqual(f.statusWrites, []);
});

test("volume sweep skips deletion when the compare-and-set claim fails", async () => {
  const r = row({
    id: "ca_sweep_claim_lost",
    status: "deprovisioning",
    updated_at: Date.now() - 15 * 24 * 60 * 60_000,
  });
  const f = fakes({
    expiredRows: [r],
    volumes: [{ id: "vol_revived" }],
    claimSwept: false,
  });
  await sweepVolumes(f.db, f.provider);
  assert.deepEqual(f.claimSweptCalls, [{ id: r.id, observedUpdatedAt: r.updated_at }]);
  assert.deepEqual(f.volumesDeleted, []);
  assert.deepEqual(f.unclaimSweptCalls, []);
});

test("volume sweep restores the original retention timestamp when deletion fails", async () => {
  const r = row({
    id: "ca_sweep_delete_error",
    status: "deprovisioning",
    updated_at: Date.now() - 15 * 24 * 60 * 60_000,
  });
  const f = fakes({
    expiredRows: [r],
    volumes: [{ id: "vol_delete_error" }],
    deleteVolumeError: new Error("delete failed"),
  });
  await sweepVolumes(f.db, f.provider);
  assert.deepEqual(f.claimSweptCalls, [{ id: r.id, observedUpdatedAt: r.updated_at }]);
  assert.deepEqual(f.volumeDeleteAttempts, ["vol_delete_error"]);
  assert.deepEqual(f.volumesDeleted, []);
  assert.deepEqual(f.unclaimSweptCalls, [{ id: r.id, originalUpdatedAt: r.updated_at }]);
});

test("orphan volume sweep deletes unattached volumes without active rows", async () => {
  const f = fakes({
    allVolumes: [
      { id: "vol_orphan", name: "vol_anchor_orphan" },
      { id: "vol_other", name: "other_volume" },
    ],
  });
  await sweepVolumes(f.db, f.provider);
  assert.deepEqual(f.volumeDeleteAttempts, ["vol_orphan"]);
  assert.deepEqual(f.volumesDeleted, ["vol_orphan"]);
});

test("orphan volume sweep keeps volumes for groups with a non-gone row", async () => {
  const active = row({ group_id: "grp_active", status: "provisioning" });
  const f = fakes({
    activeGroupIds: [active.group_id],
    allVolumes: [{ id: "vol_active", name: volumeName(active.group_id) }],
  });
  await sweepVolumes(f.db, f.provider);
  assert.deepEqual(f.volumeDeleteAttempts, []);
});

test("orphan volume sweep keeps attached orphan volumes", async () => {
  const f = fakes({
    allVolumes: [
      {
        id: "vol_attached_orphan",
        name: "vol_anchor_orphan",
        attachedMachineId: "m1",
      },
    ],
  });
  await sweepVolumes(f.db, f.provider);
  assert.deepEqual(f.volumeDeleteAttempts, []);
});

test("orphan volume sweep continues after a delete failure", async () => {
  const f = fakes({
    allVolumes: [
      { id: "vol_failed", name: "vol_anchor_failed" },
      { id: "vol_next", name: "vol_anchor_next" },
    ],
    deleteVolumeError: new Error("delete failed"),
  });
  await sweepVolumes(f.db, f.provider);
  assert.deepEqual(f.volumeDeleteAttempts, ["vol_failed", "vol_next"]);
  assert.deepEqual(f.volumesDeleted, []);
});

test("an online anchor with a live node is not rewritten", async () => {
  const f = fakes({ nodes: [{ id: "n1", name: "m1", anchor: true, online: true }] });
  await reconcile(row(), f.db, f.cp, f.provider);
  assert.deepEqual(f.statuses, []);
});

test("a second anchor on the anchor plan is parked before any machine exists", async () => {
  const f = fakes({ blockers: ["ca_0"] });
  await reconcile(row({ status: "pending", fly_machine_id: null, node_id: null }), f.db, f.cp, f.provider);
  assert.deepEqual(f.created, []);
  assert.deepEqual(f.statuses, ["conflict"]);
});

test("a fourth anchor+ row conflicts when three other rows hold machines", async () => {
  const f = fakes({ blockers: ["ca_a", "ca_b", "ca_c"] });
  await reconcile(
    row({ id: "ca_fourth", status: "pending", plan: "anchor+" }),
    f.db,
    f.cp,
    f.provider,
  );
  assert.deepEqual(f.statuses, ["conflict"]);
  assert.deepEqual(f.statusWrites[0]?.patch, {
    error: "plan covers 3 anchors; rows ca_a, ca_b, ca_c already hold them",
  });
  assert.deepEqual(f.created, []);
});

test("a third anchor+ row provisions when two other rows hold machines", async () => {
  const f = fakes({ blockers: ["ca_a", "ca_b"] });
  await reconcile(
    row({ id: "ca_third", status: "pending", plan: "anchor+" }),
    f.db,
    f.cp,
    f.provider,
  );
  assert.deepEqual(f.statuses, ["provisioning"]);
  assert.equal(f.created.length, 1);
});

test("the only anchor on the anchor plan provisions", async () => {
  const f = fakes();
  await reconcile(row({ status: "pending", fly_machine_id: null, node_id: null }), f.db, f.cp, f.provider);
  assert.equal(f.created.length, 1);
  assert.deepEqual(f.statuses, ["provisioning"]);
});

test("setStatus resets attempts when the row comes online", async () => {
  const db = new AnchorDb(":memory:");
  const sql = (db as unknown as { client: { execute: (s: string) => Promise<{ rows: unknown[] }> } }).client;
  await sql.execute(
    "CREATE TABLE cloud_anchor (id TEXT, user_id TEXT, group_id TEXT, desired TEXT, status TEXT, error TEXT, attempts INTEGER, created_at INTEGER, updated_at INTEGER)",
  );
  await sql.execute("INSERT INTO cloud_anchor VALUES ('ca_1', 'u1', 'grp_1', 'provisioned', 'pending', NULL, 0, 0, 0)");
  await db.setStatus("ca_1", "error", { error: "boom" });
  await db.setStatus("ca_1", "pending");
  const attempts = async () =>
    ((await sql.execute("SELECT attempts FROM cloud_anchor")).rows[0] as { attempts: number }).attempts;
  assert.equal(await attempts(), 2);
  await db.setStatus("ca_1", "online");
  assert.equal(await attempts(), 0);
});

test("outrankingAnchorsOfUser returns machine holders and the oldest live rows", async () => {
  const db = new AnchorDb(":memory:");
  const sql = (db as unknown as { client: { execute: (s: string) => Promise<unknown> } }).client;
  await sql.execute(
    "CREATE TABLE cloud_anchor (id TEXT, user_id TEXT, group_id TEXT, desired TEXT, status TEXT, created_at INTEGER)",
  );
  await sql.execute(
    "INSERT INTO cloud_anchor VALUES ('ca_a', 'u1', 'grp_a', 'provisioned', 'conflict', 1), ('ca_b', 'u1', 'grp_b', 'provisioned', 'pending', 2), ('ca_c', 'u1', 'grp_c', 'provisioned', 'gone', 0), ('ca_d', 'u1', 'grp_d', 'provisioned', 'online', 3)",
  );
  const outranking = (id: string, group: string, created: number, limit: number) =>
    db.outrankingAnchorsOfUser(row({ id, group_id: group, created_at: created }), limit);
  // Machine holders and the oldest non-torn-down rows outrank this row.
  assert.deepEqual((await outranking("ca_a", "grp_a", 1, 3)).sort(), ["ca_d"]);
  assert.deepEqual((await outranking("ca_b", "grp_b", 2, 3)).sort(), ["ca_a", "ca_d"]);
  assert.equal((await outranking("ca_b", "grp_b", 2, 1)).length, 1);
  // Once the newer row holds a machine, the older row yields instead.
  await sql.execute("UPDATE cloud_anchor SET status = 'provisioning' WHERE id = 'ca_b'");
  assert.deepEqual((await outranking("ca_a", "grp_a", 1, 3)).sort(), ["ca_b", "ca_d"]);
});
