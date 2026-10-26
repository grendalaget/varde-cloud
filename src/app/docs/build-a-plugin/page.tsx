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

async function verifyRequest(request, envelope) {
  const authorization = request.headers.authorization ?? "";
  if (!authorization.startsWith("Bearer ")) {
    throw new Error("Missing bearer token");
  }

  const { payload } = await jwtVerify(
    authorization.slice(7),
    secret,
    {
      algorithms: ["HS256"],
      issuer: "varde-control-plane",
      audience: pluginId,
    },
  );

  const validClaims =
    typeof payload.sub === "string" &&
    typeof payload.grp === "string" &&
    typeof payload.role === "string" &&
    typeof payload.iat === "number" &&
    typeof payload.exp === "number" &&
    typeof payload.jti === "string" &&
    payload.jti.length > 0 &&
    payload.exp - payload.iat === 60 &&
    payload.sub === envelope.user?.id &&
    payload.grp === envelope.group_id &&
    payload.role === envelope.user?.role;

  if (!validClaims) {
    throw new Error("Invalid token claims");
  }

  return payload;
}

createServer(async (request, response) => {
  try {
    if (request.method !== "POST") {
      return sendJson(response, 405, { error: "Use POST" });
    }

    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const operation = request.headers["x-varde-op"];
    const envelope = await readJson(request);
    await verifyRequest(request, envelope);

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
        return sendJson(response, 400, {
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
  } catch {
    return sendJson(response, 400, { error: "Invalid plugin request" });
  }
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
          Save this as <Code>server-notes.json</Code>. The manifest fields are{" "}
          <Code>id</Code>, <Code>name</Code>, <Code>version</Code>,{" "}
          <Code>base_url</Code>, one of <Code>secret_env</Code> or{" "}
          <Code>secret_file</Code>, and optional <Code>service_token</Code>,{" "}
          <Code>settings</Code>, and <Code>pages</Code>. The plugin ID is
          lowercase ASCII, starts with a letter, and has 2 to 32 letters,
          numbers, or hyphens. Names and versions must be non-empty. The base
          URL must use HTTP or HTTPS and cannot include credentials, a query,
          or a fragment; trailing slashes are removed. Exactly one secret
          source is required, and its value must be at least 32 bytes. When
          using <Code>secret_file</Code>, relative paths resolve beside the
          manifest and trailing line endings are ignored. Unknown fields and
          duplicate plugin IDs stop the control plane from loading.
          <CodeBlock language="json" code={MANIFEST_EXAMPLE} />
          A page has a unique lowercase ID, a non-empty title, an optional list
          endpoint, and optional actions. Each action has a unique ID within
          its page, a non-empty title, an endpoint, and optional fields. Page
          and action IDs start with a lowercase letter and contain up to 32
          lowercase letters, numbers, or hyphens. Field names are unique,
          start with a lowercase letter, and may use lowercase letters,
          numbers, and underscores up to 64 characters. Endpoint paths are
          relative, start with <Code>/</Code>, contain no scheme or host, and
          cannot contain <Code>..</Code>. A field may
          set <Code>required</Code>, <Code>help</Code>, and a type-checked{" "}
          <Code>default</Code>, but secret fields cannot have a default.{" "}
          <Code>hidden</Code> is only valid for settings, <Code>secret</Code>{" "}
          only for string fields, and <Code>requires</Code> only for{" "}
          <Code>member_multiselect</Code>, where its supported value is{" "}
          <Code>steam_id</Code>. The supported field types are{" "}
          <Code>string</Code>, <Code>int</Code>, <Code>bool</Code>,{" "}
          <Code>select</Code>, <Code>secret</Code>, <Code>multiselect</Code>,
          and <Code>member_multiselect</Code>. Both <Code>select</Code> and{" "}
          <Code>multiselect</Code> need string options, and submitted values
          must match those options. Required fields cannot be omitted.
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
          issue time <Code>iat</Code>, expiry <Code>exp</Code> 60 seconds after
          issue, and a random <Code>jti</Code>. The example checks the signing
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
          Group owners enter <Code>server-notes</Code> under Settings, then
          select Enable plugin. The Server notes page appears in the dashboard
          navigation.
        </Step>
      </Steps>

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

      <H2>Field types</H2>
      <P>
        A <Code>secret</Code> field is secret text;{" "}
        <Code>{'{"secret":true}'}</Code> is also allowed on a string field.
        Defaults cannot be secret, and <Code>hidden</Code> is only for settings.
        A member multiselect accepts group user IDs and can declare{" "}
        <Code>{'{"requires":"steam_id"}'}</Code>. The control plane expands
        selected members in the envelope to objects like{" "}
        <Code>
          {
            '[{"user_id":"user-id","display_name":"Member","steam_id":"verified-id"}]'
          }
        </Code>
        not a list of IDs.
      </P>

      <H2>Handle errors and limits</H2>
      <P>
        Return a 4xx status with <Code>{'{"error":"message"}'}</Code> for a
        user-fixable problem. Varde shows that message and truncates it to 300
        characters. A 5xx response, timeout, invalid JSON, invalid reply, or
        response over 1 MiB becomes <Code>plugin_unavailable</Code>. Calls time
        out after 10 seconds, and redirects are not followed. Keep successful
        responses small and JSON encoded.
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
          community plugin example
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
