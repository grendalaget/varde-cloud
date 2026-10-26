import { Chip } from "@heroui/react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  Callout,
  Code,
  CodeBlock,
  DocTitle,
  H2,
  P,
  Step,
  Steps,
} from "@/components/docs-primitives";
import { DocChecklist } from "@/components/docs/doc-checklist";

export const metadata: Metadata = {
  title: "Build a Varde plugin: manifest, signed requests and pages",
  description:
    "Build a Varde plugin with a JSON manifest, signed HTTP requests, a native page, and an action. Follow a Node example with request, reply, and security details.",
  alternates: { canonical: "/docs/build-a-plugin" },
  openGraph: {
    title: "Build a Varde plugin: manifest, signed requests and pages",
    description:
      "Build a Varde plugin with a JSON manifest, signed HTTP requests, a native page, and an action. Follow a Node example with request, reply, and security details.",
    url: "/docs/build-a-plugin",
    type: "article",
  },
};

const NEED = [
  "Node.js 20 or later",
  "A self-hosted control plane",
  "A plugin secret",
];

const SERVER_NOTES_EXAMPLE = String.raw`import { createServer } from "node:http";
import { jwtVerify } from "jose";

const pluginId = "server-notes";
const secret = new TextEncoder().encode(process.env.SERVER_NOTES_SECRET ?? "");
const port = Number(process.env.PORT ?? "7300");
const notesByGroup = new Map();
const maxRequestBytes = 1024 * 1024;

if (secret.byteLength < 32) {
  throw new Error("SERVER_NOTES_SECRET must be at least 32 bytes");
}

function sendJson(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(body),
  });
  response.end(body);
}

async function readJson(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxRequestBytes) {
      throw new Error("Request body is too large");
    }
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function isRequestEnvelope(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof value.group_id === "string" &&
    value.user !== null &&
    typeof value.user === "object" &&
    !Array.isArray(value.user) &&
    typeof value.user.id === "string" &&
    typeof value.user.display_name === "string" &&
    typeof value.user.role === "string" &&
    value.settings !== null &&
    typeof value.settings === "object" &&
    !Array.isArray(value.settings)
  );
}

async function verifyRequest(request, envelope) {
  const authorization = request.headers.authorization ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(
      authorization.slice(7),
      secret,
      {
        algorithms: ["HS256"],
        issuer: "varde-control-plane",
        audience: pluginId,
      },
    );

    return (
      typeof payload.sub === "string" &&
      typeof payload.grp === "string" &&
      typeof payload.role === "string" &&
      typeof payload.iat === "number" &&
      typeof payload.exp === "number" &&
      typeof payload.jti === "string" &&
      payload.jti.length > 0 &&
      payload.exp - payload.iat <= 60 &&
      payload.sub === envelope.user.id &&
      payload.grp === envelope.group_id &&
      payload.role === envelope.user.role
    );
  } catch {
    return false;
  }
}

createServer(async (request, response) => {
  if (request.method !== "POST") {
    return sendJson(response, 405, { error: "Use POST" });
  }

  let envelope;
  try {
    envelope = await readJson(request);
  } catch {
    return sendJson(response, 400, { error: "Malformed request body" });
  }

  if (!isRequestEnvelope(envelope)) {
    return sendJson(response, 400, { error: "Malformed request body" });
  }

  if (!(await verifyRequest(request, envelope))) {
    return sendJson(response, 401, { error: "Unauthorized" });
  }

  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const operation = request.headers["x-varde-op"];

  if (url.pathname === "/varde/v1/settings" && operation === "settings") {
    return sendJson(response, 200, {
      store: { service_state: "ready" },
    });
  }

  if (url.pathname === "/varde/v1/disable" && operation === "disable") {
    notesByGroup.delete(envelope.group_id);
    return sendJson(response, 200, { message: "Plugin disabled" });
  }

  if (url.pathname === "/varde/notes" && operation === "list") {
    const notes = notesByGroup.get(envelope.group_id) ?? [];
    const items = notes.map((note) => ({
      title: note.text,
      subtitle: "Added by " + note.displayName,
      status: "Saved",
    }));
    return sendJson(response, 200, { items });
  }

  if (
    url.pathname === "/varde/notes" &&
    operation === "action:add-note"
  ) {
    const value = envelope.values?.note;
    if (typeof value !== "string" || value.trim() === "") {
      return sendJson(response, 422, {
        error: "Write a note before saving.",
      });
    }

    const notes = notesByGroup.get(envelope.group_id) ?? [];
    notes.push({
      text: value.trim(),
      displayName: envelope.user.display_name,
    });
    notesByGroup.set(envelope.group_id, notes);
    return sendJson(response, 200, {
      message: "Note added",
      notes: ["Visible to this group"],
    });
  }

  return sendJson(response, 404, { error: "Unknown plugin route" });
}).listen(port, "127.0.0.1");`;

const MANIFEST_EXAMPLE = `{
  "id": "server-notes",
  "name": "Server notes",
  "version": "1.0.0",
  "base_url": "http://127.0.0.1:7300",
  "secret_env": "SERVER_NOTES_SECRET",
  "service_token": "server-notes",
  "settings": [
    { "name": "service_state", "type": "string", "hidden": true }
  ],
  "pages": [
    {
      "id": "notes",
      "title": "Server notes",
      "list": { "endpoint": "/varde/notes" },
      "actions": [
        {
          "id": "add-note",
          "title": "Add note",
          "endpoint": "/varde/notes",
          "fields": [
            {
              "name": "note",
              "type": "string",
              "help": "Write a note for your group."
            }
          ]
        }
      ]
    }
  ]
}`;

export default function BuildAPlugin() {
  return (
    <>
      <DocTitle
        title="Build a Varde plugin with signed requests and pages"
        intro="This tutorial builds one small Node service: a Server notes page with a list and an Add note action. Notes live in memory per group, so a restart clears them."
      />
      <ul className="flex flex-wrap gap-2">
        {NEED.map((item) => (
          <li key={item}>
            <Chip variant="secondary" size="sm">
              <Chip.Label>{item}</Chip.Label>
            </Chip>
          </li>
        ))}
      </ul>

      <H2>The short version</H2>
      <P>
        The control plane reads a JSON manifest, signs each HTTP request with
        HS256, and draws the declared settings and pages using Varde&rsquo;s
        native interface. Your service handles the data and actions.
      </P>
      <DocChecklist
        title="Plugin build checklist"
        items={[
          "Write and validate a manifest",
          "Verify each signed control plane request",
          "Return the list and action response shapes",
          "Load the plugin in a self-hosted control plane",
        ]}
      />

      <H2>Step by step</H2>
      <Steps>
        <Step n={1} title="Define the manifest">
          The JSON manifest tells the control plane what service to load and
          which settings and pages to draw. Save this as{" "}
          <Code>server-notes.json</Code>.
          <CodeBlock language="json" code={MANIFEST_EXAMPLE} />
        </Step>
        <Step n={2} title="Write the HTTP service">
          Use Node.js 20 or later and install <Code>jose</Code> in the project
          folder. Set <Code>SERVER_NOTES_SECRET</Code> to the same value the
          control plane reads from the manifest&rsquo;s <Code>secret_env</Code>.
          Save the service as{" "}
          <Code>server-notes.mjs</Code>, then start it with{" "}
          <Code>node server-notes.mjs</Code> after setting the environment
          variable. This is the complete example service:
          <CodeBlock language="shell" code="npm install jose" />
          <CodeBlock language="JavaScript" code={SERVER_NOTES_EXAMPLE} />
          Run the service with the same secret value the control plane uses:
          <CodeBlock
            language="shell"
            code={'SERVER_NOTES_SECRET="<shared 32-byte secret>" PORT=7300 node server-notes.mjs'}
          />
          Replace the placeholder with a secret of at least 32 bytes, and set
          the same value in the control plane environment.
        </Step>
        <Step n={3} title="Verify each signed request">
          The control plane sends a POST with a JSON envelope and the{" "}
          <Code>X-Varde-Op</Code> header. The envelope contains{" "}
          <Code>group_id</Code>, <Code>user</Code> with its ID, display name,
          and role, plus <Code>settings</Code>. Action calls also include{" "}
          <Code>values</Code>. The authorization token is an HS256 JWT with
          issuer <Code>varde-control-plane</Code>, audience equal to your plugin
          ID, subject equal to the user ID, group claim <Code>grp</Code>, role,
          issue time <Code>iat</Code>, expiry <Code>exp</Code> no more than 60
          seconds later, and a random <Code>jti</Code>. The example checks the signing
          algorithm, issuer, audience, expiry, and the identity, group, role,
          issue time, and token ID claims against the request.
          <CodeBlock
            language="json"
            code={`{
  "group_id": "group-id",
  "user": {
    "id": "user-id",
    "display_name": "Member",
    "role": "member"
  },
  "settings": {
    "service_state": "ready"
  }
}`}
          />
          <Code>X-Varde-Op</Code> is <Code>list</Code>,{" "}
          <Code>action:add-note</Code>, <Code>settings</Code>, or{" "}
          <Code>disable</Code>. The plugin secret is used to verify the
          signature and is not included in the envelope.
        </Step>
        <Step n={4} title="Return the page and action replies">
          A list reply is{" "}
          <Code>
            {
              '{"items":[{"title":"Ready for Friday","subtitle":"Added by Sam","status":"Saved"}]}'
            }
          </Code>
          . Each item can include <Code>title</Code>, <Code>subtitle</Code>,{" "}
          <Code>status</Code>, and an optional HTTP or HTTPS <Code>href</Code>.
          The example maps each group&rsquo;s in-memory notes into these items.
          An action reply is{" "}
          <Code>
            {'{"message":"Note added","notes":["Visible to this group"]}'}
          </Code>
          , with optional HTTP or HTTPS <Code>href</Code>. A successful reply
          must be JSON.
        </Step>
        <Step n={5} title="Load and enable the plugin">
          Run the service on the base URL in the manifest, then start the
          control plane with <Code>--plugin /path/server-notes.json</Code> and
          the same <Code>SERVER_NOTES_SECRET</Code> environment variable.
          In the group&rsquo;s <Code>Settings</Code>, find the{" "}
          <Code>Server notes</Code> plugin in the <Code>Plugins</Code> card and
          select <Code>Enable plugin</Code>. The page appears in the dashboard
          navigation.
        </Step>
      </Steps>

      <H2>Manifest reference</H2>
      <ul className="my-5 space-y-4 pl-5 text-muted">
        <li>
          <strong className="text-foreground">Plugin fields</strong>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <Code>id</Code>, <Code>name</Code>, <Code>version</Code>, and{" "}
              <Code>base_url</Code> are required. The ID is lowercase ASCII,
              starts with a letter, and has 2 to 32 letters, numbers, or
              hyphens. Names and versions must be non-empty.
            </li>
            <li>
              <Code>base_url</Code> uses HTTP or HTTPS without credentials, a
              query, or a fragment. Trailing slashes are removed.
            </li>
            <li>
              Set exactly one of <Code>secret_env</Code> and{" "}
              <Code>secret_file</Code>. The secret must be at least 32 bytes.
              Relative secret file paths resolve beside the manifest, and
              trailing line endings are ignored.
            </li>
            <li>
              <Code>service_token</Code>, <Code>settings</Code>, and{" "}
              <Code>pages</Code> are optional. Unknown fields and duplicate
              plugin IDs prevent the control plane from starting.
            </li>
          </ul>
        </li>
        <li>
          <strong className="text-foreground">Pages and actions</strong>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              A page needs a unique ID and non-empty title. It may have a list
              endpoint and actions. An action needs a unique ID within its page,
              a non-empty title, and an endpoint; fields are optional.
            </li>
            <li>
              Page and action IDs start with a lowercase letter and use up to
              32 lowercase letters, numbers, or hyphens. Endpoints are relative
              paths starting with <Code>/</Code>, with no scheme, host, or{" "}
              <Code>..</Code>.
            </li>
          </ul>
        </li>
        <li>
          <strong className="text-foreground">Fields and field types</strong>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Field names are unique, start with a lowercase letter, and use
              lowercase letters, numbers, and underscores up to 64 characters.
              Fields may set <Code>required</Code>, <Code>help</Code>, and a
              type-checked <Code>default</Code>. Required fields cannot be
              omitted, and secret fields cannot have a default.
            </li>
            <li>
              Types are <Code>string</Code>, <Code>int</Code>, <Code>bool</Code>,{" "}
              <Code>select</Code>, <Code>secret</Code>,{" "}
              <Code>multiselect</Code>, and <Code>member_multiselect</Code>.
              Both select types need string options, and submitted values must
              match them.
            </li>
            <li>
              <Code>hidden</Code> is only for settings. The{" "}
              <Code>{'{"secret":true}'}</Code> flag is only valid on{" "}
              <Code>string</Code> fields; the <Code>secret</Code> type is
              already a secret string. A <Code>member_multiselect</Code>{" "}
              accepts group user IDs and can declare{" "}
              <Code>{'{"requires":"steam_id"}'}</Code>. The control plane
              expands selected members into objects with <Code>user_id</Code>,{" "}
              <Code>display_name</Code>, and <Code>steam_id</Code>, not IDs.
            </li>
          </ul>
        </li>
      </ul>

      <H2>Settings and disable hooks</H2>
      <P>
        The control plane calls <Code>/varde/v1/settings</Code> with operation{" "}
        <Code>settings</Code> after enabling or updating plugin settings. The
        response <Code>{'{"store":{"service_state":"ready"}}'}</Code> is merged
        only into declared hidden settings. A hidden setting is controlled by
        the service, not submitted by a group member. The example returns{" "}
        <Code>service_state</Code> this way. When an owner disables the plugin,
        the control plane calls <Code>/varde/v1/disable</Code> with operation{" "}
        <Code>disable</Code>. That call is best-effort.
      </P>

      <H2>Handle errors and limits</H2>
      <P>
        Return <Code>400</Code> for a malformed request body and{" "}
        <Code>401</Code> for an invalid signed request. For a user-fixable
        action problem, return another 4xx status with{" "}
        <Code>{'{"error":"message"}'}</Code>. Varde shows that message and
        truncates it to 300 characters. A 5xx response, timeout, invalid JSON,
        invalid reply, or response over 1 MiB becomes{" "}
        <Code>plugin_unavailable</Code>. Calls time out after 10 seconds, and
        redirects are not followed. Keep successful responses small and JSON
        encoded.
      </P>

      <H2>Call Varde with a service token</H2>
      <P>
        If the plugin needs Varde data, use a service token whose name matches
        the manifest&rsquo;s <Code>service_token</Code>. Give it only the
        required scopes and bind it to the group that enabled the plugin. For
        example, a token with the <Code>members</Code> scope can list that
        group&rsquo;s members:
      </P>
      <CodeBlock
        language="JavaScript"
        code={`const response = await fetch(
  process.env.VARDE_CONTROL_PLANE_URL +
    "/v1/groups/" + encodeURIComponent(groupId) + "/members",
  {
    headers: {
      authorization: "Bearer " + process.env.VARDE_SERVICE_TOKEN,
    },
  },
);
if (!response.ok) {
  throw new Error("Varde API request failed");
}
const { members } = await response.json();`}
      />

      <H2>Server addons</H2>
      <P>
        Plugins can also manage typed server addons with HTTPS archives, a
        lowercase SHA-256 digest, a driver target, and small relative files.
        Addon writes need the matching group-bound service token with the{" "}
        <Code>server_addons</Code> scope. Varde applies addon changes at the
        next server start and does not restart a running server. The{" "}
        <Link href="https://github.com/grendalaget/varde/blob/main/docs/plugins.md">
          full plugin reference
        </Link>{" "}
        covers the remaining limits and fields.
      </P>
      <P>
        For a plugin codebase in active use, see the{" "}
        <Link href="https://github.com/grendalaget/varde-plugin-autotournament">
          Auto Tournament plugin
        </Link>
        .
      </P>

      <Callout tone="glod" title="The short version">
        A Varde plugin is an HTTP service with a manifest, verified signed
        requests, and JSON replies. Varde draws the interface and keeps
        requests scoped to the group.
      </Callout>

      <H2>What&rsquo;s next</H2>
      <P>
        See how operators install plugins in{" "}
        <Link href="/docs/plugins">Varde plugins</Link>. For the broader
        control plane and setup, follow the{" "}
        <Link href="/docs/host-a-server">host guide</Link>.
      </P>
    </>
  );
}
