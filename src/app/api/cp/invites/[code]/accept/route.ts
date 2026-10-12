import { cpErrorResponse, cpUser, isResponse } from "@/lib/cp-route";
import { withCp } from "@/lib/cp";

// Accept a real invite — the signed-in reader joins the group for real.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const user = await cpUser();
  if (isResponse(user)) return user;
  const { code } = await params;
  try {
    const result = await withCp(user, (cp) =>
      cp.post<{ group_id: string }>(
        `/v1/invites/${encodeURIComponent(code)}/accept`,
        {},
      ),
    );
    return Response.json(result);
  } catch (e) {
    return cpErrorResponse(e);
  }
}
