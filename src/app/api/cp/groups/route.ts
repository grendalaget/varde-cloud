import { cpErrorResponse, cpUser, isResponse } from "@/lib/cp-route";
import { withCp } from "@/lib/cp";

// Create a group on the hosted CP (caller becomes its owner). Used when a
// signed-in docs reader has no group yet — the demo makes one inline.
export async function POST(req: Request) {
  const user = await cpUser();
  if (isResponse(user)) return user;

  let name = "";
  try {
    const body = (await req.json()) as { name?: string };
    name = (body.name ?? "").trim();
  } catch {
    /* fall through to validation */
  }
  if (!name || name.length > 80) {
    return Response.json(
      { error: "validation", message: "name is required (max 80 chars)" },
      { status: 400 },
    );
  }

  try {
    const group = await withCp(user, (cp) =>
      cp.post<{ id: string; name: string }>("/v1/groups", { name }),
    );
    return Response.json(
      { group: { id: group.id, name: group.name, role: "owner" } },
      { status: 201 },
    );
  } catch (e) {
    return cpErrorResponse(e);
  }
}
