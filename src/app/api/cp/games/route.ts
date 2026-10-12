import { cpErrorResponse, cpUser, isResponse } from "@/lib/cp-route";
import { withCp } from "@/lib/cp";

// Real game catalog from the hosted CP for the create-server demo.
export async function GET() {
  const user = await cpUser();
  if (isResponse(user)) return user;
  try {
    const data = await withCp(user, (cp) =>
      cp.get<{ games: unknown[] }>("/v1/games"),
    );
    return Response.json(data);
  } catch (e) {
    return cpErrorResponse(e);
  }
}
