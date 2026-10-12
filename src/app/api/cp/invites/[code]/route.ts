import { cpErrorResponse, cpUser, isResponse } from "@/lib/cp-route";
import { withCp } from "@/lib/cp";

// Invite preview — group name, uses, expiry — before the user accepts.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const user = await cpUser();
  if (isResponse(user)) return user;
  const { code } = await params;
  try {
    const invite = await withCp(user, (cp) =>
      cp.get<unknown>(`/v1/invites/${encodeURIComponent(code)}`),
    );
    return Response.json({ invite });
  } catch (e) {
    return cpErrorResponse(e);
  }
}
