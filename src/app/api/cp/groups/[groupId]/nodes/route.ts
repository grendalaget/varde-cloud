import { cpErrorResponse, cpUser, isResponse } from "@/lib/cp-route";
import { withCp } from "@/lib/cp";

// Machines linked to the group — fills the "preferred machine" picker in
// the create-server demo with real nodes.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const user = await cpUser();
  if (isResponse(user)) return user;
  const { groupId } = await params;
  try {
    const data = await withCp(user, (cp) =>
      cp.get<{ nodes: unknown[] }>(`/v1/groups/${encodeURIComponent(groupId)}/nodes`),
    );
    return Response.json(data);
  } catch (e) {
    return cpErrorResponse(e);
  }
}
