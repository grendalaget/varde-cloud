"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { Mark } from "./brand";

/**
 * Interactive "how it works" scene: your group as four machines, the cairn
 * (the shared world save) replicated to each of them, and an ember marking
 * whoever currently hosts. Drag the ember onto another machine to hand
 * hosting over; click a machine to drop it offline and watch failover.
 * Ada always rides the relay, so NAT traversal shows up unprompted.
 *
 * Rendering: one WebGL2 canvas draws the living layer — bezier edge ribbons
 * with flowing bands and point-sprite particles (papir = game traffic,
 * Glød = save chunks). Chips, labels and the ember are DOM, so everything
 * stays crisp, accessible and keyboard-operable. "Nerd view" flips every
 * chip to its technical back and tags the edges with the real protocols.
 * Reduced motion renders a static frame; no WebGL2 falls back to plain SVG
 * edges; a lost context rebuilds on restore.
 */

type MachineId = "you" | "sara" | "kim" | "ada";
type NodeId = MachineId | "cp" | "relay" | "cairn";
type Pt = { x: number; y: number };
type EdgeKind = "game" | "sync" | "cp";

type Edge = { id: string; a: NodeId; b: NodeId; kind: EdgeKind };
type GeomEdge = { edge: Edge; geom: [Pt, Pt, Pt] };

const MACHINE_IDS: MachineId[] = ["you", "sara", "kim", "ada"];
const NAMES: Record<MachineId, string> = {
  you: "You",
  sara: "Sara",
  kim: "Kim",
  ada: "Ada",
};
const BLOB_PHASE: Record<MachineId, string> = {
  you: "vd-blob-c",
  sara: "",
  kim: "vd-blob-b",
  ada: "vd-blob-c",
};
/** Ada's machine↔machine path always detours through the relay. */
const RELAYED: MachineId = "ada";

const LAYOUT_WIDE: Record<NodeId, Pt> = {
  cp: { x: 14, y: 10 },
  relay: { x: 86, y: 10 },
  cairn: { x: 50, y: 44 },
  you: { x: 9, y: 88 },
  sara: { x: 36.3, y: 90 },
  kim: { x: 63.7, y: 90 },
  ada: { x: 91, y: 88 },
};
const LAYOUT_NARROW: Record<NodeId, Pt> = {
  cp: { x: 23, y: 8 },
  relay: { x: 77, y: 8 },
  cairn: { x: 50, y: 38 },
  you: { x: 23, y: 71 },
  sara: { x: 77, y: 71 },
  kim: { x: 23, y: 91 },
  ada: { x: 77, y: 91 },
};

/* ------------------------------------------------------------------ */
/* Edges                                                               */
/* ------------------------------------------------------------------ */

/** Bow each quadratic bezier upward by `k` of its chord length. */
function edgeGeom(a: Pt, b: Pt, k: number): [Pt, Pt, Pt] {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  let px = -dy / len;
  let py = dx / len;
  if (py > 0) {
    px = -px;
    py = -py;
  }
  return [a, { x: mx + px * len * k, y: my + py * len * k }, b];
}

function quadAt(p0: Pt, c: Pt, p1: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
  };
}

const BOW: Record<EdgeKind, number> = { game: 0.16, sync: 0.07, cp: 0.1 };

/** The edge set the current state wants. Game paths to Ada detour via the
 *  relay; the cairn's replica edges stay put regardless of who hosts —
 *  that is the whole point. */
function desiredEdges(host: MachineId, offline: Set<MachineId>): Edge[] {
  const online = MACHINE_IDS.filter((m) => !offline.has(m));
  const list: Edge[] = [];
  for (const m of online) {
    list.push({ id: `cp-${m}`, a: "cp", b: m, kind: "cp" });
    list.push({ id: `sync-${m}`, a: "cairn", b: m, kind: "sync" });
  }
  for (const m of online) {
    if (m === host) continue;
    if (host === RELAYED || m === RELAYED) {
      const far: NodeId = host === RELAYED ? m : host;
      list.push({ id: `game-${far}-relay`, a: far, b: "relay", kind: "game" });
      list.push({ id: `game-relay-ada`, a: "relay", b: "ada", kind: "game" });
    } else {
      list.push({ id: `game-${host}-${m}`, a: host, b: m, kind: "game" });
    }
  }
  return list;
}

/* ------------------------------------------------------------------ */
/* WebGL2 layer                                                        */
/* ------------------------------------------------------------------ */

const MAX_EDGES = 32;
const PARTS_PER_EDGE = 30;
const DPR_MAX = 2;

const RIBBON_VERT = `#version 300 es
in vec2 a_pos;      // device px
in float a_t;       // 0..1 along the curve
in float a_side;    // -1 / +1 across the ribbon
uniform vec2 u_res;
out float v_t;
out float v_side;
void main() {
  vec2 clip = (a_pos / u_res) * 2.0 - 1.0;
  gl_Position = vec4(clip * vec2(1.0, -1.0), 0.0, 1.0);
  v_t = a_t;
  v_side = a_side;
}`;

const RIBBON_FRAG = `#version 300 es
precision highp float;
in float v_t;
in float v_side;
uniform vec3 u_col;
uniform float u_alpha;   // edge fade in/out
uniform float u_time;
uniform float u_speed;
uniform float u_seed;
out vec4 fragColor;
void main() {
  // Two overlaid flow bands sliding along the edge, so the line reads as
  // moving energy rather than a dashed stroke.
  float f1 = 0.5 + 0.5 * sin(6.2832 * (v_t * 1.6 - u_time * u_speed) + u_seed * 9.0);
  float f2 = 0.5 + 0.5 * sin(6.2832 * (v_t * 3.7 - u_time * u_speed * 1.9) + u_seed * 23.0);
  float flow = 0.30 + 0.70 * f1 * f2;
  float across = pow(max(1.0 - abs(v_side), 0.0), 1.5);
  float a = u_alpha * across * flow;
  fragColor = vec4(u_col * a, a); // premultiplied
}`;

const PART_VERT = `#version 300 es
in float a_edge;
in float a_seed;
uniform vec2 u_res;
uniform float u_time;
uniform float u_dpr;
uniform vec2 u_geo[${MAX_EDGES * 3}];   // p0, ctrl, p1 per edge, device px
uniform vec4 u_pstate[${MAX_EDGES}];    // flow, chunkMix, twoWay, alpha
uniform vec4 u_pmeta[${MAX_EDGES}];     // speed, -, -, -
uniform vec3 u_colPapir;
uniform vec3 u_colGlod;
out vec3 v_col;
out float v_a;
float hash(float s) { return fract(sin(s * 91.7) * 43758.5453); }
void main() {
  int e = int(a_edge + 0.5);
  vec4 st = u_pstate[e];
  vec4 mt = u_pmeta[e];
  float h1 = hash(a_seed);
  float h2 = hash(a_seed * 1.71);
  float h3 = hash(a_seed * 2.31);
  // Two-way edges alternate direction per particle; one-way always a->b.
  float dir = (st.z > 0.5 && h3 > 0.5) ? -1.0 : 1.0;
  float t = fract(h1 * 7.31 + u_time * mt.x * dir);
  vec2 p0 = u_geo[e * 3];
  vec2 c  = u_geo[e * 3 + 1];
  vec2 p1 = u_geo[e * 3 + 2];
  float u = 1.0 - t;
  vec2 pos = u * u * p0 + 2.0 * u * t * c + t * t * p1;
  // Perpendicular jitter so packets read as a lane, not a rail.
  vec2 tang = normalize(2.0 * u * (c - p0) + 2.0 * t * (p1 - c) + vec2(1e-4));
  pos += vec2(-tang.y, tang.x) * (h2 - 0.5) * 7.0 * u_dpr;
  float on = step(h2 * 0.85 + h1 * 0.15, st.x);
  float ends = smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.92, t);
  v_a = on * ends * st.w;
  v_col = mix(u_colPapir, u_colGlod, st.y);
  gl_PointSize = (1.6 + 3.0 * h2) * u_dpr * (0.8 + 0.5 * st.y);
  vec2 clip = (pos / u_res) * 2.0 - 1.0;
  gl_Position = vec4(clip * vec2(1.0, -1.0), 0.0, 1.0);
}`;

const PART_FRAG = `#version 300 es
precision highp float;
in vec3 v_col;
in float v_a;
out vec4 fragColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d) * 2.0;
  float a = v_a * smoothstep(1.0, 0.35, r);
  fragColor = vec4(v_col * a, a); // premultiplied, additive
}`;

const COL_GAME = [0.96, 0.9, 0.84];
const COL_SYNC = [1.0, 0.42, 0.15];
const COL_CP = [0.58, 0.55, 0.53];
const COL_PAPIR = [0.97, 0.93, 0.88];
const COL_GLOD = [1.0, 0.38, 0.13];

const KIND_STYLE: Record<
  EdgeKind,
  { col: number[]; alpha: number; flow: number; chunk: number; speed: number; twoWay: number; width: number }
> = {
  game: { col: COL_GAME, alpha: 0.75, flow: 0.7, chunk: 0, speed: 0.5, twoWay: 1, width: 2.4 },
  sync: { col: COL_SYNC, alpha: 0.5, flow: 0.34, chunk: 1, speed: 0.34, twoWay: 0, width: 1.6 },
  cp: { col: COL_CP, alpha: 0.42, flow: 0.14, chunk: 0, speed: 0.22, twoWay: 0, width: 1.4 },
};

type LiveEdge = GeomEdge & { alpha: number; dying: boolean; burstT?: number };

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(sh) ?? "shader compile failed");
  return sh;
}

function linkProgram(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(p) ?? "link failed");
  return p;
}

/** The GL layer behind the scene. Imperative: React pushes desired edges
 *  and burst events, the engine fades between them. */
function createEngine(
  canvas: HTMLCanvasElement,
  cb?: { lost?(): void; restored?(): void },
) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  let dead = false;
  let raf = 0;
  let visible = true;
  let dpr = 1;
  let reduced = false;
  let progR: WebGLProgram;
  let progP: WebGLProgram;
  let vaoR: WebGLVertexArrayObject;
  let vaoP: WebGLVertexArrayObject;
  let vbo: WebGLBuffer;
  let pbo: WebGLBuffer;
  const locR: Record<string, WebGLUniformLocation | null> = {};
  const locP: Record<string, WebGLUniformLocation | null> = {};
  const live: LiveEdge[] = [];
  const ranges: { start: number; count: number }[] = [];
  const geo = new Float32Array(MAX_EDGES * 3 * 2);
  const pstate = new Float32Array(MAX_EDGES * 4);
  const pmeta = new Float32Array(MAX_EDGES * 4);
  let partCount = 0;
  const seeds: number[] = [];

  /* Percent-space geometry -> device-px uniforms + ribbon VBO. */
  const rebuild = () => {
    const w = canvas.width;
    const h = canvas.height;
    geo.fill(0);
    const verts: number[] = [];
    ranges.length = 0;
    live.forEach((le, i) => {
      const [p0, c, p1] = le.geom;
      const g0 = { x: (p0.x / 100) * w, y: (p0.y / 100) * h };
      const g1 = { x: (c.x / 100) * w, y: (c.y / 100) * h };
      const g2 = { x: (p1.x / 100) * w, y: (p1.y / 100) * h };
      geo.set([g0.x, g0.y], i * 6);
      geo.set([g1.x, g1.y], i * 6 + 2);
      geo.set([g2.x, g2.y], i * 6 + 4);

      const SEG = 36;
      const half = (KIND_STYLE[le.edge.kind].width / 2) * dpr;
      const start = verts.length / 4;
      for (let s = 0; s <= SEG; s++) {
        const t = s / SEG;
        const p = quadAt(g0, g1, g2, t);
        const p2 = quadAt(g0, g1, g2, Math.min(t + 0.02, 1));
        let tx = p2.x - p.x;
        let ty = p2.y - p.y;
        const tl = Math.hypot(tx, ty) || 1;
        tx /= tl;
        ty /= tl;
        verts.push(p.x - ty * half, p.y + tx * half, t, -1);
        verts.push(p.x + ty * half, p.y - tx * half, t, 1);
      }
      ranges.push({ start, count: (SEG + 1) * 2 });
    });

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);

    // Particle pool: PARTS_PER_EDGE verts per live edge index.
    partCount = live.length * PARTS_PER_EDGE;
    while (seeds.length < live.length * PARTS_PER_EDGE)
      seeds.push(Math.random() * 100);
    const pdata = new Float32Array(partCount * 2);
    for (let i = 0; i < partCount; i++) {
      pdata[i * 2] = i / PARTS_PER_EDGE; // edge index
      pdata[i * 2 + 1] = seeds[i];
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, pbo);
    gl.bufferData(gl.ARRAY_BUFFER, pdata, gl.STATIC_DRAW);
  };

  const render = (now: number) => {
    const t = now / 1000;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Ribbons
    gl.useProgram(progR);
    gl.bindVertexArray(vaoR);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    live.forEach((le, i) => {
      const r = ranges[i];
      if (!r) return;
      const st = KIND_STYLE[le.edge.kind];
      const a = le.alpha * st.alpha;
      if (a < 0.01) return;
      gl.uniform3fv(locR.u_col!, st.col);
      gl.uniform1f(locR.u_alpha!, a);
      gl.uniform1f(locR.u_time!, t);
      gl.uniform1f(locR.u_speed!, st.speed);
      gl.uniform1f(locR.u_seed!, (i * 0.618) % 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, r.start, r.count);
    });

    // Particles
    pstate.fill(0);
    live.forEach((le, i) => {
      const st = KIND_STYLE[le.edge.kind];
      const burstAge = t - (le.burstT ?? -1e3);
      const burst = le.burstT != null && burstAge > 0 ? Math.exp(-burstAge * 1.8) : 0;
      pstate[i * 4] = Math.min(1, st.flow + burst);
      pstate[i * 4 + 1] = Math.min(1, st.chunk + burst);
      pstate[i * 4 + 2] = st.twoWay;
      pstate[i * 4 + 3] = le.alpha;
      pmeta[i * 4] = st.speed * (1 + burst * 1.5);
    });
    gl.useProgram(progP);
    gl.bindVertexArray(vaoP);
    gl.blendFunc(gl.ONE, gl.ONE); // additive
    gl.uniform2fv(locP["u_geo[0]"]!, geo);
    gl.uniform4fv(locP["u_pstate[0]"]!, pstate);
    gl.uniform4fv(locP["u_pmeta[0]"]!, pmeta);
    gl.uniform1f(locP.u_time!, t);
    if (partCount > 0) gl.drawArrays(gl.POINTS, 0, partCount);
    gl.bindVertexArray(null);
  };

  const init = () => {
    progR = linkProgram(gl, RIBBON_VERT, RIBBON_FRAG);
    progP = linkProgram(gl, PART_VERT, PART_FRAG);
    gl.enable(gl.BLEND); // context state — must be re-set after restore

    const UR = (n: string) => gl.getUniformLocation(progR, n);
    for (const n of ["u_res", "u_col", "u_alpha", "u_time", "u_speed", "u_seed"])
      locR[n] = UR(n);
    const UP = (n: string) => gl.getUniformLocation(progP, n);
    for (const n of [
      "u_res", "u_time", "u_dpr", "u_geo[0]", "u_pstate[0]", "u_pmeta[0]",
      "u_colPapir", "u_colGlod",
    ])
      locP[n] = UP(n);

    vaoR = gl.createVertexArray()!;
    gl.bindVertexArray(vaoR);
    vbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    let p = gl.getAttribLocation(progR, "a_pos");
    gl.enableVertexAttribArray(p);
    gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 16, 0);
    p = gl.getAttribLocation(progR, "a_t");
    gl.enableVertexAttribArray(p);
    gl.vertexAttribPointer(p, 1, gl.FLOAT, false, 16, 8);
    p = gl.getAttribLocation(progR, "a_side");
    gl.enableVertexAttribArray(p);
    gl.vertexAttribPointer(p, 1, gl.FLOAT, false, 16, 12);
    gl.bindVertexArray(null);

    vaoP = gl.createVertexArray()!;
    gl.bindVertexArray(vaoP);
    pbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, pbo);
    p = gl.getAttribLocation(progP, "a_edge");
    gl.enableVertexAttribArray(p);
    gl.vertexAttribPointer(p, 1, gl.FLOAT, false, 8, 0);
    p = gl.getAttribLocation(progP, "a_seed");
    gl.enableVertexAttribArray(p);
    gl.vertexAttribPointer(p, 1, gl.FLOAT, false, 8, 4);
    gl.bindVertexArray(null);

    gl.useProgram(progP);
    gl.uniform3fv(locP.u_colPapir!, COL_PAPIR);
    gl.uniform3fv(locP.u_colGlod!, COL_GLOD);
  };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.floor(Math.min(devicePixelRatio || 1, DPR_MAX) * 4) / 4 || 1;
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(progR);
    gl.uniform2f(locR.u_res!, canvas.width, canvas.height);
    gl.useProgram(progP);
    gl.uniform2f(locP.u_res!, canvas.width, canvas.height);
    gl.uniform1f(locP.u_dpr!, dpr);
    rebuild();
    if (reduced) render(0);
  };

  init();
  reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const tick = (now: number) => {
    raf = 0;
    if (dead || !visible) return;
    for (let i = live.length - 1; i >= 0; i--) {
      const le = live[i];
      const target = le.dying ? 0 : 1;
      le.alpha += (target - le.alpha) * 0.09;
      if (le.dying && le.alpha < 0.02) {
        live.splice(i, 1);
        rebuild();
      }
    }
    render(now);
    raf = requestAnimationFrame(tick);
  };

  const onLost = (e: Event) => {
    e.preventDefault();
    dead = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    cb?.lost?.();
  };
  const onRestored = () => {
    try {
      init();
      resize();
    } catch {
      return;
    }
    dead = false;
    cb?.restored?.();
    if (reduced) render(0);
    else if (visible && !raf) raf = requestAnimationFrame(tick);
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  const io = new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf && !reduced && !dead) raf = requestAnimationFrame(tick);
    },
    { threshold: 0 },
  );
  io.observe(canvas);

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  resize();
  if (reduced) render(0);
  else raf = requestAnimationFrame(tick);

  return {
    /** Push the desired edge set (percent-space geometry resolved). */
    setTargets(targets: GeomEdge[]) {
      const wanted = new Map(targets.map((t, i) => [t.edge.id, { t, i }]));
      for (const le of live) le.dying = !wanted.has(le.edge.id);
      for (const [id, { t }] of wanted) {
        const le = live.find((l) => l.edge.id === id);
        if (le) {
          le.geom = t.geom;
        } else if (live.length < MAX_EDGES) {
          live.push({ edge: t.edge, geom: t.geom, alpha: 0, dying: false });
        }
      }
      live.sort(
        (a, b) => (wanted.get(a.edge.id)?.i ?? 999) - (wanted.get(b.edge.id)?.i ?? 999),
      );
      if (reduced) {
        // No rAF loop to drive fades — snap to the desired state instead.
        for (let i = live.length - 1; i >= 0; i--) {
          live[i].alpha = live[i].dying ? 0 : 1;
          if (live[i].dying) live.splice(i, 1);
        }
      }
      rebuild();
      if (reduced) render(0);
    },
    burst(edgeId: string) {
      const le = live.find((l) => l.edge.id === edgeId);
      if (le) le.burstT = performance.now() / 1000;
      if (reduced) render(0);
    },
    destroy() {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Copy                                                                */
/* ------------------------------------------------------------------ */

type SceneEvent =
  | { kind: "idle" }
  | { kind: "move"; to: MachineId; from: MachineId }
  | { kind: "fail"; dead: MachineId; to: MachineId }
  | { kind: "rejoin"; m: MachineId }
  | { kind: "offline"; m: MachineId }
  | { kind: "reject"; m: MachineId }
  | { kind: "wake"; m: MachineId }
  | { kind: "sleep" };

function caption(ev: SceneEvent, nerd: boolean, host: MachineId): string {
  const H = NAMES[host];
  switch (ev.kind) {
    case "idle":
      return nerd
        ? "Every machine runs an agent (gRPC/UDS + mesh node). Game traffic rides QUIC/TLS 1.3 streams — direct, or relayed for Ada. Snapshot chunks (FastCDC, zstd, BLAKE3) keep each replica identical; agents reach the control plane over HTTPS/OpenAPI. Your 127.77.x.y loopback never changes."
        : `${H}'s PC is hosting — everyone plays on her machine, and every machine holds a synced copy of the world. Drag the ember to hand hosting to someone else; click a machine to knock it offline.`;
    case "move":
      return nerd
        ? `Host lease moved to ${ev.to}: QUIC streams retarget while everyone's 127.77.x.y route stays stable. Only changed chunks shipped — dedupe did the rest.`
        : `${NAMES[ev.to]} takes the ember — her copy of the world was already synced, so only the server moves. Everyone reconnects automatically; the address on each PC never changed.`;
    case "fail":
      return nerd
        ? `${ev.dead}'s lease expired; the fencing watchdog elects ${ev.to} (most-synced replica). GameDriver boots, QUIC streams re-establish, loopback routes retarget.`
        : `${NAMES[ev.dead]} dropped offline mid-game. The world was never only on her machine — ${NAMES[ev.to]}'s synced copy picks up hosting and the group reconnects.`;
    case "offline":
      return nerd
        ? `${ev.m} left the mesh: her streams close and her replica goes stale — the world copy stays on her disk.`
        : `${NAMES[ev.m]} went offline. Her copy of the world stays on her disk, ready for when she's back.`;
    case "rejoin":
      return nerd
        ? `${ev.m} rejoins the mesh: QUIC re-establishes and the snapshot store catches her replica up by missing BLAKE3 chunks.`
        : `${NAMES[ev.m]} is back. The chunks she missed stream over, and she's a candidate to host again.`;
    case "wake":
      return nerd
        ? `${ev.m} rejoins with a current replica — the fencing watchdog hands her the lease and the world wakes on her node.`
        : `${NAMES[ev.m]} is back — and her synced copy wakes the world, so she picks up hosting.`;
    case "reject":
      return nerd
        ? `${ev.m} is offline — no peer, no lease. Rejoin first.`
        : `${NAMES[ev.m]} is offline — she can't host. Click her machine to bring her back.`;
    case "sleep":
      return nerd
        ? "All replicas offline: state persists in each snapshot store. No lease, no host, until a node returns."
        : "Everyone's offline — the world sleeps on their disks, synced and safe. An always-on anchor (soon) keeps it live instead.";
  }
}

const LONGEST_CAPTION =
  "Every machine runs an agent (gRPC/UDS + mesh node). Game traffic rides QUIC/TLS 1.3 streams — direct, or relayed for Ada. Snapshot chunks (FastCDC, zstd, BLAKE3) keep each replica identical; agents reach the control plane over HTTPS/OpenAPI. Your 127.77.x.y loopback never changes.";

/* ------------------------------------------------------------------ */
/* Chips                                                               */
/* ------------------------------------------------------------------ */

function CairnsGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <rect x="9" y="4" width="6" height="4" rx="2" />
      <rect x="7" y="10" width="10" height="4" rx="2" />
      <rect x="4" y="16" width="16" height="4" rx="2" />
    </svg>
  );
}

const FLIP_INNER =
  "relative h-full w-full rounded-2xl bg-surface-200 transform-3d transition-transform duration-500 ease-vd-spring";
const FACE = "flex flex-col items-center justify-center p-2.5 text-center backface-hidden";
const FACE_BACK = `${FACE} absolute inset-0 rotate-y-180 font-mono`;

function MachineChip({
  id,
  pos,
  hosting,
  offline,
  nerd,
  hover,
  compact,
  onToggle,
}: {
  id: MachineId;
  pos: Pt;
  hosting: boolean;
  offline: boolean;
  nerd: boolean;
  hover: boolean;
  compact: boolean;
  onToggle: (m: MachineId) => void;
}) {
  const status = offline ? "Offline" : hosting ? "Hosting" : "Playing";
  return (
    <button
      type="button"
      aria-pressed={!offline}
      aria-label={`${NAMES[id]}'s machine, ${status.toLowerCase()}. Click to ${offline ? "bring it back online" : "knock it offline"}.`}
      onClick={() => onToggle(id)}
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      className={`group absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl border outline-none transition-[border-color,box-shadow,opacity,left,top] duration-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glod ${
        compact ? "w-24" : "w-32"
      } ${
        hover
          ? "border-glod shadow-[0_0_0_4px_rgba(255,91,31,0.15)]"
          : hosting
            ? "border-glod/60"
            : "border-separator hover:border-surface-400"
      } ${offline ? "opacity-45" : ""}`}
    >
      <div className={`${FLIP_INNER} ${nerd ? "rotate-y-180" : ""}`}>
        <div className={FACE}>
          <span className="relative mb-1 flex items-center gap-1.5">
            <span
              className={`vd-blob block size-2.5 ${
                offline ? "bg-skifer-600" : hosting ? "bg-glod" : "bg-success"
              } ${BLOB_PHASE[id]}`}
            />
            <CairnsGlyph
              className={`size-3 transition-colors ${
                offline ? "text-skifer-600" : "text-glod/80"
              }`}
            />
          </span>
          <span className="whitespace-nowrap text-sm font-semibold text-foreground">
            {NAMES[id]}
          </span>
          <span className="mt-0.5 whitespace-nowrap text-xs leading-tight text-muted">
            {status}
          </span>
        </div>
        <div className={FACE_BACK}>
          <span className="whitespace-nowrap text-[11px] font-semibold text-foreground">
            {NAMES[id]}
          </span>
          <span className="mt-1 whitespace-nowrap text-[10px] leading-tight text-muted">
            {hosting ? "agent + GameDriver" : "agent · mesh"}
          </span>
          <span className="whitespace-nowrap text-[10px] leading-tight text-muted">
            {offline ? "replica on disk" : "gRPC/UDS · 127.77.x.y"}
          </span>
        </div>
      </div>
    </button>
  );
}

function NodeChip({
  pos,
  label,
  sub,
  nerd,
  nerdLines,
  lit,
  icon,
}: {
  pos: Pt;
  label: string;
  sub: string;
  nerd: boolean;
  nerdLines: string[];
  lit: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      className={`absolute z-10 w-24 -translate-x-1/2 -translate-y-1/2 rounded-2xl border transition-opacity sm:w-28 ${
        lit ? "border-separator" : "border-separator/60 opacity-50"
      }`}
    >
      <div className={`${FLIP_INNER} bg-surface-200/90 ${nerd ? "rotate-y-180" : ""}`}>
        <div className={FACE}>
          <span className="mb-1 text-muted">{icon}</span>
          <span className="whitespace-nowrap text-xs font-semibold text-foreground sm:text-sm">
            {label}
          </span>
          <span className="mt-0.5 whitespace-nowrap text-[10px] leading-tight text-muted sm:text-xs">
            {sub}
          </span>
        </div>
        <div className={FACE_BACK}>
          {nerdLines.map((l) => (
            <span key={l} className="whitespace-nowrap text-[10px] leading-tight text-muted">
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

export function HostingScene() {
  const [host, setHost] = useState<MachineId>("sara");
  const [offline, setOffline] = useState<Set<MachineId>>(new Set());
  const [nerd, setNerd] = useState(false);
  const [compact, setCompact] = useState(false);
  const [drag, setDrag] = useState<Pt | null>(null);
  const [hover, setHover] = useState<MachineId | null>(null);
  const [ev, setEv] = useState<SceneEvent>({ kind: "idle" });
  const [glFailed, setGlFailed] = useState(false);
  const [glLost, setGlLost] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ReturnType<typeof createEngine> | null>(null);
  const offlineRef = useRef(offline);
  const hostRef = useRef(host);
  const failTimer = useRef<number>(0);
  const dragPosRef = useRef<Pt | null>(null);
  useEffect(() => {
    offlineRef.current = offline;
  }, [offline]);
  useEffect(() => {
    hostRef.current = host;
  }, [host]);

  const layout = compact ? LAYOUT_NARROW : LAYOUT_WIDE;
  const allOffline = offline.size === MACHINE_IDS.length;

  const edges = useMemo(() => desiredEdges(host, offline), [host, offline]);
  const geomEdges = useMemo(
    () =>
      edges.map((e) => ({
        edge: e,
        geom: edgeGeom(layout[e.a], layout[e.b], BOW[e.kind]),
      })),
    [edges, layout],
  );

  /* GL init — StrictMode re-runs this on the same canvas element, which is
     why the engine never calls loseContext() on cleanup. */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let engine: ReturnType<typeof createEngine> | null = null;
    try {
      engine = createEngine(canvas, {
        lost: () => setGlLost(true),
        restored: () => setGlLost(false),
      });
    } catch (e) {
      console.warn("hosting-scene: GL init failed", e);
    }
    if (!engine) {
      setGlFailed(true);
      return;
    }
    engineRef.current = engine;
    return () => {
      engineRef.current = null;
      engine.destroy();
    };
  }, []);

  /* Push desired edges whenever topology or layout changes. */
  useEffect(() => {
    engineRef.current?.setTargets(geomEdges);
  }, [geomEdges]);

  /* Compact layout switch. */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const ro = new ResizeObserver(([e]) => setCompact(e.contentRect.width < 560));
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  const burst = useCallback(
    (edgeId: string) => engineRef.current?.burst(edgeId),
    [],
  );

  const migrate = useCallback(
    (to: MachineId, via: "move" | "fail" | "wake", from: MachineId) => {
      setHost(to);
      burst(`sync-${to}`);
      setEv(
        via === "fail"
          ? { kind: "fail", dead: from, to }
          : via === "wake"
            ? { kind: "wake", m: to }
            : { kind: "move", to, from },
      );
    },
    [burst],
  );

  const toggleMachine = (m: MachineId) => {
    const next = new Set(offline);
    if (next.has(m)) {
      next.delete(m);
      setOffline(next);
      if (next.has(host)) {
        // The host is still dead — the rejoining machine wakes the world.
        window.clearTimeout(failTimer.current);
        migrate(m, "wake", host);
      } else {
        setEv({ kind: "rejoin", m });
      }
      window.setTimeout(() => burst(`sync-${m}`), 150);
    } else {
      next.add(m);
      setOffline(next);
      if (next.size === MACHINE_IDS.length) {
        setEv({ kind: "sleep" });
      } else if (m === host) {
        // Failover: the ember sits dark on the dead host for a beat, then hops.
        setEv({ kind: "offline", m });
        window.clearTimeout(failTimer.current);
        failTimer.current = window.setTimeout(() => {
          // Stale if the ember already moved or the machine came back.
          if (hostRef.current !== m || !offlineRef.current.has(m)) return;
          const cand = MACHINE_IDS.filter((x) => !offlineRef.current.has(x));
          if (cand.length) {
            migrate(cand[(Math.random() * cand.length) | 0], "fail", m);
          }
        }, 750);
      } else {
        setEv({ kind: "offline", m });
      }
    }
  };

  useEffect(() => () => window.clearTimeout(failTimer.current), []);

  /* Ember position: dragged point, or hovering above the host chip. */
  const emberPos: Pt = drag ?? {
    x: layout[host].x,
    y: layout[host].y - (compact ? 15 : 13),
  };

  const nearestMachine = (p: Pt): MachineId | null => {
    let best: MachineId | null = null;
    let bestD = 16; // percent units
    for (const m of MACHINE_IDS) {
      const d = Math.hypot(layout[m].x - p.x, layout[m].y - p.y);
      if (d < bestD) {
        bestD = d;
        best = m;
      }
    }
    return best;
  };

  const stageToPct = (e: React.PointerEvent): Pt => {
    const r = stageRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    };
  };

  const onEmberDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    dragPosRef.current = emberPos;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onEmberMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragPosRef.current == null) return;
    const p = stageToPct(e);
    dragPosRef.current = p;
    setDrag(p);
    setHover(nearestMachine(p));
  };
  const onEmberUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragPosRef.current == null) return;
    const p = stageToPct(e);
    dragPosRef.current = null;
    setDrag(null);
    setHover(null);
    const m = nearestMachine(p);
    if (m && !offline.has(m) && m !== host) migrate(m, "move", host);
    else if (m && offline.has(m)) setEv({ kind: "reject", m });
  };
  const onEmberKey = (e: React.KeyboardEvent) => {
    if (!e.key.startsWith("Arrow")) return;
    e.preventDefault();
    const online = MACHINE_IDS.filter((m) => !offline.has(m));
    if (online.length < 2) return;
    const dir = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
    const next =
      online[(online.indexOf(host) + dir + online.length) % online.length];
    migrate(next, "move", host);
  };

  /* Nerd-mode edge labels: tag every game edge; one sync and one cp edge
     carry the longer protocol strings so the diagram stays readable. */
  const seen = new Set<EdgeKind>();
  const edgeLabel = (e: Edge): string | null => {
    if (e.kind === "game")
      return e.a === "relay" || e.b === "relay" ? "relayed" : "QUIC · TLS 1.3";
    if (e.kind === "sync" && !seen.has("sync")) {
      seen.add("sync");
      return "FastCDC · zstd · BLAKE3";
    }
    if (e.kind === "cp" && !seen.has("cp")) {
      seen.add("cp");
      return "HTTPS · OpenAPI";
    }
    return null;
  };

  const relayLit = !offline.has(RELAYED) && !allOffline;

  return (
    <figure className="rounded-2xl border border-separator bg-surface-100 p-3 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1 sm:px-0">
        <p className="text-xs text-muted sm:text-sm">
          Drag the ember to move hosting. Click a machine to drop it offline.
        </p>
        <ToggleButtonGroup
          aria-label="View mode"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[nerd ? "nerd" : "plain"]}
          onSelectionChange={(keys) => {
            const next = keys.values().next().value;
            if (next != null) setNerd(next === "nerd");
          }}
          size="sm"
        >
          <ToggleButton id="plain">Group view</ToggleButton>
          <ToggleButton id="nerd">Nerd view</ToggleButton>
        </ToggleButtonGroup>
      </div>

      <div
        ref={stageRef}
        className="relative mx-auto aspect-[4/5] w-full max-w-xl select-none sm:aspect-[16/9] sm:max-w-4xl"
      >
        {/* Living layer */}
        <canvas
          ref={canvasRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
        {(glFailed || glLost) && (
          <svg
            aria-hidden
            className="absolute inset-0 h-full w-full bg-surface-100"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {geomEdges.map((e) => {
              const [p0, c, p1] = e.geom;
              return (
                <path
                  key={e.edge.id}
                  d={`M${p0.x} ${p0.y} Q${c.x} ${c.y} ${p1.x} ${p1.y}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={e.edge.kind === "game" ? 1.6 : 1}
                  vectorEffect="non-scaling-stroke"
                  strokeDasharray={e.edge.kind === "sync" ? "3 3" : undefined}
                  className={
                    e.edge.kind === "game"
                      ? "text-skifer-200"
                      : e.edge.kind === "sync"
                        ? "text-glod/60"
                        : "text-separator"
                  }
                />
              );
            })}
          </svg>
        )}

        {/* Nerd-mode edge labels, placed at each bezier's midpoint. */}
        {nerd &&
          geomEdges.map((e) => {
            const label = edgeLabel(e.edge);
            if (!label) return null;
            const mid = quadAt(e.geom[0], e.geom[1], e.geom[2], 0.5);
            return (
              <span
                key={`lbl-${e.edge.id}`}
                aria-hidden
                style={{ left: `${mid.x}%`, top: `${mid.y}%` }}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-md border border-separator bg-surface-100/90 px-1.5 py-0.5 font-mono text-[9px] text-muted"
              >
                {label}
              </span>
            );
          })}

        {/* Nodes */}
        <NodeChip
          pos={layout.cp}
          label="Control plane"
          sub="Address book"
          lit
          nerd={nerd}
          nerdLines={["control plane", "OpenAPI · fed JWT"]}
          icon={
            <svg viewBox="0 0 24 24" className="size-4 sm:size-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
              <rect x="4" y="5" width="16" height="14" rx="2.5" />
              <path d="M8 9h8M8 13h5" strokeLinecap="round" />
            </svg>
          }
        />
        <NodeChip
          pos={layout.relay}
          label="Relay"
          sub="Encrypted detour"
          lit={relayLit}
          nerd={nerd}
          nerdLines={["relay", "sealed QUIC"]}
          icon={
            <svg viewBox="0 0 24 24" className="size-4 sm:size-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
              <rect x="6" y="10" width="12" height="9" rx="2" />
              <path d="M9 10V7a3 3 0 0 1 6 0v3" strokeLinecap="round" />
            </svg>
          }
        />
        <NodeChip
          pos={layout.cairn}
          label="The world"
          sub="Shared save"
          lit
          nerd={nerd}
          nerdLines={["snapshot store", "FastCDC · zstd · BLAKE3"]}
          icon={
            <Mark
              className="size-7 text-skifer-100 sm:size-9"
              title="The cairn: the shared world save"
            />
          }
        />

        {MACHINE_IDS.map((m) => (
          <MachineChip
            key={m}
            id={m}
            pos={layout[m]}
            hosting={m === host}
            offline={offline.has(m)}
            nerd={nerd}
            hover={hover === m}
            compact={compact}
            onToggle={toggleMachine}
          />
        ))}

        {/* The ember — who hosts right now. Drag it. */}
        <button
          type="button"
          aria-label="The hosting ember: whoever carries it runs the server. Drag onto a machine to move hosting, or use arrow keys."
          onPointerDown={onEmberDown}
          onPointerMove={onEmberMove}
          onPointerUp={onEmberUp}
          onKeyDown={onEmberKey}
          style={{
            left: `${emberPos.x}%`,
            top: `${emberPos.y}%`,
            transition: drag
              ? "none"
              : "left .7s var(--ease-vd-spring), top .7s var(--ease-vd-spring), opacity .3s",
            touchAction: "none",
          }}
          className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full p-3 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glod active:cursor-grabbing ${
            offline.has(host) ? "opacity-40" : ""
          }`}
        >
          <span className="pointer-events-none absolute inset-0 -m-2 rounded-full bg-glod/25 blur-md" />
          <span className="pointer-events-none block size-3.5 rounded-full bg-glod shadow-[0_0_12px_rgba(255,91,31,0.9)]" />
        </button>
      </div>

      <figcaption
        aria-live="polite"
        className="mt-4 grid rounded-xl border border-separator bg-surface-200 px-4 py-3 text-center text-sm text-muted"
      >
        <span className="invisible col-start-1 row-start-1" aria-hidden>
          {LONGEST_CAPTION}
        </span>
        <span className="col-start-1 row-start-1">
          {allOffline ? caption({ kind: "sleep" }, nerd, host) : caption(ev, nerd, host)}
        </span>
      </figcaption>
    </figure>
  );
}
