// Bootstrap endpoint: anchor machines fetch their CP enroll token over the
// 6PN private network at first boot instead of carrying it in machine env
// (config is readable by anyone with machines-API access on the app).
// Caller proof: the request must arrive from the 6PN private IP of the
// machine the reconciler created for that group — a stolen URL is useless
// anywhere else on the network.
import { createServer, type Server } from "node:http";
import { wantsAnchor, type AnchorDb } from "./db";
import type { CpClient } from "./cp";
import type { AnchorProvider } from "./provider";
import { machineName } from "./names";

export function startBootstrap(
  db: AnchorDb,
  cp: CpClient,
  provider: AnchorProvider,
  cpUrl: string,
  port: number,
): Server {
  const srv = createServer((req, res) => {
    void (async () => {
      const m = /^\/bootstrap\/([\w-]+)$/.exec(req.url ?? "");
      if (req.method !== "GET" || !m) {
        res.writeHead(404).end();
        return;
      }
      const groupId = m[1];
      const row = await db.rowByGroup(groupId);
      // Only serve while a provision is actually expected AND the
      // subscription still includes an anchor: a canceled plan stops
      // minting tokens immediately, before teardown destroys the machine.
      if (!row || !wantsAnchor(row) || !row.fly_machine_id) {
        res.writeHead(404).end();
        return;
      }
      const machine = await provider.find(machineName(groupId));
      // Match the row's machine id, not just the name: a stale same-named
      // machine lingering during a replacement must not fetch a fresh
      // enroll token for its already-dead node.
      if (
        !machine ||
        machine.id !== row.fly_machine_id ||
        !machine.privateIp ||
        req.socket.remoteAddress !== machine.privateIp
      ) {
        res.writeHead(403).end();
        return;
      }
      const token = await cp.createAnchorEnrollToken(groupId);
      res
        .writeHead(200, { "content-type": "application/json" })
        .end(JSON.stringify({ enroll_token: token.token, cp_url: cpUrl }));
    })().catch((e) => {
      console.error("bootstrap:", e);
      res.writeHead(500).end();
    });
  });
  // 6PN only: bind the private address Fly assigns, never a public one.
  const host = process.env.FLY_PRIVATE_IP ?? "127.0.0.1";
  srv.listen(port, host, () => console.log(`bootstrap: http://${host}:${port}/bootstrap/<groupId>`));
  return srv;
}
