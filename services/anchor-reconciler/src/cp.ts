// Hosted control-plane client using the `vst_…` service token minted by
// `varde-control-plane service-token create --scopes enroll,nodes`.
// Scoped: enrollment-token CRUD on any group + node read/delete. No user
// session, no group access beyond that.
export class CpClient {
  constructor(
    private baseUrl: string,
    private serviceToken: string,
  ) {}

  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.serviceToken}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      throw new Error(`cp ${method} ${path}: ${res.status} ${await res.text()}`);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  // One-use anchor enrollment token; the secret is passed to the new
  // machine's env and consumed by `varde-agent enroll --token`. Short
  // expiry: it only needs to live until first boot, and the machine env
  // it sits in is visible to anyone with Fly machine-config access.
  createAnchorEnrollToken(groupId: string): Promise<{ id: string; token: string }> {
    return this.call("POST", `/v1/groups/${groupId}/enrollment-tokens`, {
      anchor: true,
      hosting_enabled: false, // anchors replicate; they never host the game
      max_uses: 1,
      expires_at: Date.now() + 15 * 60_000,
      labels: { managed: "cloud" },
    });
  }

  listNodes(groupId: string): Promise<{ nodes: CpNode[] }> {
    return this.call("GET", `/v1/groups/${groupId}/nodes`);
  }

  deleteNode(nodeId: string): Promise<void> {
    return this.call("DELETE", `/v1/nodes/${nodeId}`);
  }
}

export interface CpNode {
  id: string;
  name: string;
  anchor: boolean;
  online: boolean;
}
