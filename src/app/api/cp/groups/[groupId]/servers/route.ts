import { cpErrorResponse, cpUser, isResponse } from "@/lib/cp-route";
import { withCp } from "@/lib/cp";

interface CpServer {
  id: string;
  name: string;
  game_id: string;
  desired_state: string;
  observed_state: string;
  service?: { loopback_ip: string } | null;
  preferred_node_id?: string | null;
}

// Create a real server on the hosted CP. `start: true` additionally calls
// /v1/servers/{id}/start — the CP creates servers stopped by default, and a
// linked machine picks it up from there.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const user = await cpUser();
  if (isResponse(user)) return user;
  const { groupId } = await params;

  let body: { name?: string; game_id?: string; preferred_node_id?: string; start?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json(
      { error: "validation", message: "invalid body" },
      { status: 400 },
    );
  }
  const name = (body.name ?? "").trim();
  if (!name || name.length > 80 || !body.game_id) {
    return Response.json(
      { error: "validation", message: "name and game_id are required" },
      { status: 400 },
    );
  }

  try {
    const gid = encodeURIComponent(groupId);
    const server = await withCp(user, async (cp) => {
      const created = await cp.post<CpServer>(`/v1/groups/${gid}/servers`, {
        name,
        game_id: body.game_id,
        ...(body.preferred_node_id
          ? { preferred_node_id: body.preferred_node_id }
          : {}),
      });
      if (body.start) {
        return cp.post<CpServer>(
          `/v1/servers/${encodeURIComponent(created.id)}/start`,
          {},
        );
      }
      return created;
    });
    return Response.json({ server }, { status: 201 });
  } catch (e) {
    return cpErrorResponse(e);
  }
}
