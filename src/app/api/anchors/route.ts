import { and, desc, eq, inArray, ne, notInArray, or } from "drizzle-orm";

import { cpErrorResponse, cpUser, isResponse } from "@/lib/cp-route";
import { listGroups } from "@/lib/cp";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";

// Cloud-anchor attach/detach for the signed-in site user. The row written
// here is the desired state; the reconciler in services/anchor-reconciler
// turns it into a Fly machine + a CP anchor node (docs/cloud-anchor.md).

// Torn-down rows: 'deprovisioning' keeps the volume for the recovery grace,
// 'gone' is final. Neither runs a machine.
const TORN_DOWN = ["gone", "deprovisioning"];

// Only what the dashboard needs: other group admins see these rows too, and
// the raw error column carries CP/Fly API responses.
function view(a: typeof schema.cloudAnchor.$inferSelect, userId: string) {
  return {
    groupId: a.groupId,
    desired: a.desired,
    status: a.status,
    mine: a.userId === userId,
  };
}

export async function GET() {
  const user = await cpUser();
  if (isResponse(user)) return user;
  // Anchors are group infra: every group admin sees them, whoever the
  // subscriber is. A CP outage degrades to own rows rather than failing
  // the dashboard's whole refresh.
  let adminGroupIds: string[] = [];
  try {
    const groups = await listGroups(user);
    adminGroupIds = groups
      .filter((g) => g.role === "owner" || g.role === "admin")
      .map((g) => g.id);
  } catch {
    // CP unreachable: own rows still answer the common case.
  }
  const anchors = await db
    .select()
    .from(schema.cloudAnchor)
    .where(
      adminGroupIds.length
        ? or(
            eq(schema.cloudAnchor.userId, user.id),
            inArray(schema.cloudAnchor.groupId, adminGroupIds),
          )
        : eq(schema.cloudAnchor.userId, user.id),
    );
  return Response.json({ anchors: anchors.map((a) => view(a, user.id)) });
}

async function groupIdFrom(req: Request): Promise<string | null> {
  try {
    const body = (await req.json()) as { group_id?: string };
    return body.group_id?.trim() || null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const user = await cpUser();
  if (isResponse(user)) return user;

  const groupId = await groupIdFrom(req);
  if (!groupId) {
    return Response.json(
      { error: "validation", message: "group_id is required" },
      { status: 400 },
    );
  }
  if (user.plan !== "anchor" && user.plan !== "anchor+") {
    return Response.json(
      { error: "plan_required", message: "Cloud anchors need the anchor plan." },
      { status: 402 },
    );
  }

  // Only the group's owner/admin may attach managed infra to it.
  try {
    const groups = await listGroups(user);
    const g = groups.find((g) => g.id === groupId);
    if (!g || (g.role !== "owner" && g.role !== "admin")) {
      return Response.json(
        { error: "forbidden", message: "Only a group admin can add a cloud anchor." },
        { status: 403 },
      );
    }
  } catch (e) {
    return cpErrorResponse(e);
  }

  // One anchor per group: a row still converging blocks a second attach,
  // whoever owns it. Torn-down rows do not — they are revived by the same
  // owner below instead of stacking duplicates.
  const existing = await db
    .select()
    .from(schema.cloudAnchor)
    .where(
      and(
        eq(schema.cloudAnchor.groupId, groupId),
        eq(schema.cloudAnchor.desired, "provisioned"),
      ),
    );
  const live = existing.find((a) => !TORN_DOWN.includes(a.status));
  if (live) {
    if (live.userId === user.id) return Response.json({ anchor: view(live, user.id) });
    return Response.json(
      { error: "conflict", message: "This group already has a cloud anchor." },
      { status: 409 },
    );
  }

  // The anchor plan covers one anchor (anchor+ is the multi-group tier).
  if (user.plan === "anchor") {
    const elsewhere = and(
      eq(schema.cloudAnchor.userId, user.id),
      ne(schema.cloudAnchor.groupId, groupId),
      eq(schema.cloudAnchor.desired, "provisioned"),
    );
    const running = await db
      .select({ id: schema.cloudAnchor.id })
      .from(schema.cloudAnchor)
      .where(and(elsewhere, notInArray(schema.cloudAnchor.status, TORN_DOWN)))
      .limit(1);
    if (running.length) {
      return Response.json(
        {
          error: "plan_limit",
          message: "Your plan covers one cloud anchor. Remove it from the other group first.",
        },
        { status: 409 },
      );
    }
    // Torn-down rows elsewhere still say desired=provisioned, and the
    // reconciler revives those on a paid plan — release them so this
    // attach stays the only one.
    await db
      .update(schema.cloudAnchor)
      .set({ desired: "detached" })
      .where(and(elsewhere, inArray(schema.cloudAnchor.status, TORN_DOWN)));
  }

  // Re-attach on the caller's own row rather than inserting a second one:
  // keeps the retained volume (and its chunks) reachable by name.
  const mine = await db
    .select()
    .from(schema.cloudAnchor)
    .where(
      and(
        eq(schema.cloudAnchor.groupId, groupId),
        eq(schema.cloudAnchor.userId, user.id),
      ),
    )
    .orderBy(desc(schema.cloudAnchor.updatedAt))
    .limit(1);
  if (mine[0]) {
    const [anchor] = await db
      .update(schema.cloudAnchor)
      // Fresh retry budget too: a parked row (attempts >= cap) would
      // otherwise be re-parked on its very first failure after reattach.
      .set({
        desired: "provisioned",
        status: "pending",
        error: null,
        attempts: 0,
      })
      .where(eq(schema.cloudAnchor.id, mine[0].id))
      .returning();
    return Response.json({ anchor: view(anchor, user.id) });
  }

  const [anchor] = await db
    .insert(schema.cloudAnchor)
    .values({
      id: `ca_${crypto.randomUUID()}`,
      userId: user.id,
      groupId,
      desired: "provisioned",
      status: "pending",
    })
    .returning();
  return Response.json({ anchor: view(anchor, user.id) }, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = await cpUser();
  if (isResponse(user)) return user;

  const groupId = await groupIdFrom(req);
  if (!groupId) {
    return Response.json(
      { error: "validation", message: "group_id is required" },
      { status: 400 },
    );
  }
  // Marks desired=detached; the reconciler drains and deletes the machine
  // and volume. Only the subscriber (or future: group admin) can detach.
  const res = await db
    .update(schema.cloudAnchor)
    .set({ desired: "detached" })
    .where(
      and(
        eq(schema.cloudAnchor.groupId, groupId),
        eq(schema.cloudAnchor.userId, user.id),
        eq(schema.cloudAnchor.desired, "provisioned"),
      ),
    )
    .returning();
  if (res.length === 0) {
    return Response.json(
      { error: "not_found", message: "No cloud anchor on this group." },
      { status: 404 },
    );
  }
  return Response.json({ anchor: view(res[0], user.id) });
}
