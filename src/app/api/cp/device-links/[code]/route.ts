import { cpErrorResponse, cpUser, isResponse } from "@/lib/cp-route";
import { withCp } from "@/lib/cp";

// Look up a pending PC-link code — shows hostname/os/state before approve.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const user = await cpUser();
  if (isResponse(user)) return user;
  const { code } = await params;
  try {
    const link = await withCp(user, (cp) =>
      cp.get<unknown>(`/v1/device-links/${encodeURIComponent(code)}`),
    );
    return Response.json({ link });
  } catch (e) {
    return cpErrorResponse(e);
  }
}
