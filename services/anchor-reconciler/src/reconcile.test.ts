import assert from "node:assert/strict";
import { test } from "node:test";

import { AnchorDb, type AnchorRow } from "./db";
import type { CpClient, CpNode } from "./cp";
import type { AnchorMachine, AnchorProvider } from "./provider";
import { reconcile } from "./reconcile";

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
  opts: { nodes?: CpNode[]; machine?: AnchorMachine | null; olderAnchor?: string } = {},
) {
  const statuses: string[] = [];
  const destroyed: string[] = [];
  const volumesDeleted: string[] = [];
  const db = {
    setStatus: async (_id: string, status: string) => void statuses.push(status),
    liveSiblingAnchor: async () => null,
    machineClaimed: async () => false,
    olderAnchorOfUser: async () => opts.olderAnchor ?? null,
  } as unknown as AnchorDb;
  const cp = {
    isGroupAdmin: async () => true,
    listNodes: async () => ({ nodes: opts.nodes ?? [] }),
    deleteNode: async () => {},
  } as unknown as CpClient;
  const created: string[] = [];
  const provider = {
    find: async () => opts.machine ?? null,
    create: async (spec: { name: string }) => {
      created.push(spec.name);
      return { id: "m2", volumeId: "v1", status: "created" };
    },
    destroy: async (id: string) => void destroyed.push(id),
    deleteVolume: async (id: string) => void volumesDeleted.push(id),
  } satisfies AnchorProvider;
  return { db, cp, provider, statuses, destroyed, volumesDeleted, created };
}

test("a parked row whose plan lapsed is still torn down", async () => {
  const f = fakes({ machine: { id: "m1", rowId: "ca_1", status: "started" } });
  const r = row({ status: "error", error: "boom", attempts: 50, plan: "free" });
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

test("an online anchor whose node went offline drops back to provisioning", async () => {
  const f = fakes({ nodes: [{ id: "n1", name: "m1", anchor: true, online: false }] });
  await reconcile(row(), f.db, f.cp, f.provider);
  assert.deepEqual(f.statuses, ["provisioning"]);
});

test("an online anchor with a live node is not rewritten", async () => {
  const f = fakes({ nodes: [{ id: "n1", name: "m1", anchor: true, online: true }] });
  await reconcile(row(), f.db, f.cp, f.provider);
  assert.deepEqual(f.statuses, []);
});

test("a second anchor on the anchor plan is parked before any machine exists", async () => {
  const f = fakes({ olderAnchor: "ca_0" });
  await reconcile(row({ status: "pending", fly_machine_id: null, node_id: null }), f.db, f.cp, f.provider);
  assert.deepEqual(f.created, []);
  assert.deepEqual(f.statuses, ["conflict"]);
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

test("olderAnchorOfUser: the oldest live row keeps the entitlement", async () => {
  const db = new AnchorDb(":memory:");
  const sql = (db as unknown as { client: { execute: (s: string) => Promise<unknown> } }).client;
  await sql.execute(
    "CREATE TABLE cloud_anchor (id TEXT, user_id TEXT, group_id TEXT, desired TEXT, status TEXT, created_at INTEGER)",
  );
  await sql.execute(
    "INSERT INTO cloud_anchor VALUES ('ca_a', 'u1', 'grp_a', 'provisioned', 'pending', 1), ('ca_b', 'u1', 'grp_b', 'provisioned', 'pending', 2), ('ca_c', 'u1', 'grp_c', 'provisioned', 'gone', 0)",
  );
  assert.equal(await db.olderAnchorOfUser(row({ id: "ca_a", group_id: "grp_a", created_at: 1 })), null);
  assert.equal(await db.olderAnchorOfUser(row({ id: "ca_b", group_id: "grp_b", created_at: 2 })), "ca_a");
});
