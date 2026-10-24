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
    let body2: { code?: string; message?: string } | null;
    try {
      body2 = (await res.json()) as { code?: string; message?: string };
    } catch {
      body2 = null;
    }
    throw new CpError(
      res.status,
      body2?.code ?? "error",
      body2?.message ?? "Something went wrong on the Varde service. Try again.",
    );
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// Reuse one CP session per user instead of exchanging per request: every
// exchange mints a 30-day CP session row, and the dashboard polls every 30s.
// shortcut: per-instance cache, so each warm instance still exchanges once
// per user per hour; move to a shared store if CP session rows pile up.
const TOKEN_TTL_MS = 60 * 60 * 1000;
const tokens = new Map<string, { token: string; until: number }>();

async function sessionToken(user: SessionUser): Promise<string> {
  const now = Date.now();
  const hit = tokens.get(user.id);
  if (hit && hit.until > now) return hit.token;
  for (const [id, t] of tokens) if (t.until <= now) tokens.delete(id);
  const token = await exchange(user);
  tokens.set(user.id, { token, until: now + TOKEN_TTL_MS });
  return token;
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
  const token = await sessionToken(user);
  // A revoked CP session must not stick: drop it so the next request
  // exchanges afresh.
  const run = <R>(method: string, path: string, body?: unknown) =>
    call<R>(token, method, path, body).catch((e: unknown) => {
      if (e instanceof CpError && e.status === 401) tokens.delete(user.id);
      throw e;
    });
  const cp = {
    get: <R>(path: string) => run<R>("GET", path),
    post: <R>(path: string, body?: unknown) => run<R>("POST", path, body),
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
