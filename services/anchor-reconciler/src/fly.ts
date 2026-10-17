// Fly Machines implementation of AnchorProvider: one machine per group in
// the `varde-anchors` app, a dedicated volume for the chunk store, no public
// services (outbound-only; the mesh is reached via outbound QUIC + relay,
// CP traffic over 6PN .internal).
import type { AnchorMachine, AnchorProvider, CreateAnchorSpec } from "./provider";

interface FlyMachine {
  id: string;
  name: string;
  state: string;
  private_ip?: string;
  config?: { env?: Record<string, string>; mounts?: { volume: string; path: string }[] };
}

interface FlyVolume {
  id: string;
  name: string;
}

export class FlyMachinesProvider implements AnchorProvider {
  constructor(
    private apiToken: string,
    private app: string,
    private image: string,
  ) {}

  private base = "https://api.machines.dev";

  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.base}/v1/apps/${this.app}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status === 404) throw new FlyNotFound();
    if (!res.ok) {
      throw new Error(`fly ${method} ${path}: ${res.status} ${await res.text()}`);
    }
    return (await res.json()) as T;
  }

  private toAnchor(m: FlyMachine): AnchorMachine {
    return {
      id: m.id,
      volumeId: m.config?.mounts?.[0]?.volume,
      privateIp: m.private_ip,
      status: m.state,
    };
  }

  async find(name: string): Promise<AnchorMachine | null> {
    const machines = await this.call<FlyMachine[]>("GET", "/machines");
    const m = machines.find((m) => m.name === name);
    if (!m) return null;
    try {
      const detail = await this.call<FlyMachine>("GET", `/machines/${m.id}`);
      return this.toAnchor(detail);
    } catch (e) {
      if (e instanceof FlyNotFound) return null;
      throw e;
    }
  }

  async create(spec: CreateAnchorSpec): Promise<AnchorMachine> {
    const vol = await this.call<FlyVolume>("POST", "/volumes", {
      // Volume names share the 30-char alnum+underscore rule.
      name: `vol_${spec.name}`.slice(0, 30),
      size_gb: spec.volumeGb,
      region: spec.region,
    });
    try {
      const m = await this.call<FlyMachine>("POST", "/machines", {
        name: spec.name,
        region: spec.region,
        config: {
          image: this.image,
          env: spec.env,
          guest: { cpu_kind: "shared", cpus: 1, memory_mb: 256 },
          mounts: [{ volume: vol.id, path: "/var/lib/varde" }],
          auto_destroy: false,
          restart: { policy: "always" },
        },
      });
      return { id: m.id, volumeId: vol.id, status: m.state };
    } catch (e) {
      // Don't leak the volume on a failed machine create.
      try {
        await this.deleteVolume(vol.id);
      } catch {}
      throw e;
    }
  }

  async start(id: string): Promise<void> {
    await this.call("POST", `/machines/${id}/start`);
  }

  async stop(id: string): Promise<void> {
    await this.call("POST", `/machines/${id}/stop`);
  }

  // Destroy/delete are idempotent: a 404 means the thing is already
  // gone, which is the desired end state.
  async destroy(id: string): Promise<void> {
    try {
      await this.call("DELETE", `/machines/${id}?force=true`);
    } catch (e) {
      if (!(e instanceof FlyNotFound)) throw e;
    }
  }

  async deleteVolume(volumeId: string): Promise<void> {
    try {
      await this.call("DELETE", `/volumes/${volumeId}`);
    } catch (e) {
      if (!(e instanceof FlyNotFound)) throw e;
    }
  }
}

export class FlyNotFound extends Error {}
