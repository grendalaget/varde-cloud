import { cpErrorResponse, cpUser, isResponse } from "@/lib/cp-route";
import { withCp } from "@/lib/cp";

// Approve a real PC-link: same call the dashboard's approve page makes.
export async function POST(req: Request) {
  const user = await cpUser();
  if (isResponse(user)) return user;

  let body: { user_code?: string; group_id?: string; name?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json(
      { error: "validation", message: "invalid body" },
      { status: 400 },
    );
  }
  const userCode = (body.user_code ?? "").trim();
  const name = (body.name ?? "").trim();
  if (!userCode || !body.group_id || !name) {
    return Response.json(
      {
        error: "validation",
        message: "user_code, group_id and name are required",
      },
      { status: 400 },
    );
  }

  try {
    const link = await withCp(user, (cp) =>
      cp.post<unknown>("/v1/device-links/approve", {
        user_code: userCode,
        group_id: body.group_id,
        name,
      }),
    );
    return Response.json({ link });
  } catch (e) {
    return cpErrorResponse(e);
  }
}
