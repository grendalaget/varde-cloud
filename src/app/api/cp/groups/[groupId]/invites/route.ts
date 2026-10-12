import { CP_BASE_URL, withCp } from "@/lib/cp";
import { cpErrorResponse, cpUser, isResponse } from "@/lib/cp-route";

interface CpInvite {
  code: string;
  group_id: string;
  group_name: string;
  expires_at: number | null;
  max_uses: number | null;
  uses: number;
}

// Mint a real invite for the group. The URL mirrors what the dashboard's
// Members page hands out: <cp>/invite/<code>.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const user = await cpUser();
  if (isResponse(user)) return user;
  const { groupId } = await params;
  try {
    const invite = await withCp(user, (cp) =>
      cp.post<CpInvite>(`/v1/groups/${encodeURIComponent(groupId)}/invites`, {}),
    );
    return Response.json(
      {
        invite: {
          ...invite,
          url: `${CP_BASE_URL}/invite/${invite.code}`,
        },
      },
      { status: 201 },
    );
  } catch (e) {
    return cpErrorResponse(e);
  }
}
