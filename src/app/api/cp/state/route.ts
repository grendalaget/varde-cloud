import { cpErrorResponse, cpUser, isResponse } from "@/lib/cp-route";
import { CpUnavailable, listGroups } from "@/lib/cp";

// The docs demos' capability probe: enabled + the user's groups, or
// enabled:false when the caller is signed out or federation can't produce
// a CP session — same answer, the demos only need "no live mode".
export async function GET() {
  const user = await cpUser();
  if (isResponse(user)) {
    return Response.json({ enabled: false, groups: [] });
  }
  try {
    const groups = await listGroups(user);
    return Response.json({ enabled: true, groups });
  } catch (e) {
    // Unavailable is not an error for the demos — it flips them to their
    // illustration state, so report it in-band with 200.
    if (e instanceof CpUnavailable) {
      return Response.json({ enabled: false, groups: [] });
    }
    return cpErrorResponse(e);
  }
}
