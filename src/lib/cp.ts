// Hosted control-plane client for varde.games pages that act on the user's
// real account (docs demos, later the site dashboard). The browser never
// talks to the CP: route handlers mint a federation token, exchange it at
// /v1/auth/external for a CP session, then call the API with the Bearer
// token — all server-side. Self-hosted CPs are never involved.
import { federationSecret, mintDesktopToken } from "./federation";

export const CP_BASE_URL = (
  process.env.VARDE_CP_URL ?? "https://cp.varde.games"
).replace(/\/$/, "");

export interface CpGroup {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
}

export class CpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

// Federation can't produce a CP session: secret unset, CP not in federated
// mode, or unreachable. Distinct from a CP error — callers show the calm
// "unavailable" state rather than an error. `message` is what a visitor
// reads; `detail` stays server-side for logs.
export class CpUnavailable extends Error {
  constructor(
    public detail: string,
    opts?: { cause?: unknown },
  ) {
    super("The Varde service is unreachable right now. Try again in a moment.", opts);
  }
}

type SessionUser = { id: string; email?: string | null; name?: string | null };

async function exchange(user: SessionUser): Promise<string> {
  const secret = federationSecret();
  if (!secret) throw new CpUnavailable("federation secret is not configured");
  const jwt = await mintDesktopToken(user, secret);
  let res: Response;
  try {
    res = await fetch(`${CP_BASE_URL}/v1/auth/external`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: jwt }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
  } catch (e) {
    throw new CpUnavailable("auth exchange failed", { cause: e });
  }
  if (res.status === 404) throw new CpUnavailable("federation is not enabled");
  if (!res.ok) {
    const msg = await errorMessage(res);
    throw new CpError(res.status, "external_login_failed", msg);
  }
  const body = (await res.json()) as { token?: string };
  if (!body.token) throw new CpUnavailable("control plane returned no session");
  return body.token;
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string; error?: string };
    return body.message ?? body.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

async function call<T>(
  token: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${CP_BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
  } catch (e) {
    throw new CpUnavailable(`api call failed: ${method} ${path}`, { cause: e });
  }
  if (!res.ok) {
    const body2 = (await res.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;
    throw new CpError(
      res.status,
      body2?.code ?? "error",
      body2?.message ?? "Something went wrong on the Varde service. Try again.",
    );
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// withCp runs fn against the hosted CP as the signed-in site user. The
// federation exchange doubles as user provisioning: first call creates the
// CP account if none exists.
export async function withCp<T>(
  user: SessionUser,
  fn: (cp: {
    get: <R>(path: string) => Promise<R>;
    post: <R>(path: string, body?: unknown) => Promise<R>;
  }) => Promise<T>,
): Promise<T> {
  const token = await exchange(user);
  const cp = {
    get: <R>(path: string) => call<R>(token, "GET", path),
    post: <R>(path: string, body?: unknown) =>
      call<R>(token, "POST", path, body),
  };
  return fn(cp);
}

// GET /v1/me returns { user, groups: [{group_id, name, role}] }.
export async function listGroups(user: SessionUser): Promise<CpGroup[]> {
  const me = await withCp(user, (cp) =>
    cp.get<{ groups: { group_id: string; name: string; role: CpGroup["role"] }[] }>(
      "/v1/me",
    ),
  );
  return me.groups.map((g) => ({ id: g.group_id, name: g.name, role: g.role }));
}
