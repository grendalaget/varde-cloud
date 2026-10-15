"use client";

import { useEffect, useRef } from "react";
import { MARK_STONES } from "./brand";

/**
 * Hero background: a monospace glyph field lit by slow-drifting noise
 * "clouds". Peaks brighten toward Tåke; clicking emits a Glød shockwave
 * whose ring is wobbled by noise so every ripple is shaped differently.
 * The Varde mark is drawn BY the field — a mask keeps its stone cells lit
 * (Tåke; the host stone stays Glød) while shockwaves still sweep through.
 *
 * One fullscreen WebGL2 fragment shader does everything; a glyph atlas and
 * the mark mask are rasterized to textures at init. No WebGL2, or
 * prefers-reduced-motion, and the CSS gradient beneath is all you see.
 */

const CELL = 10; // css px per glyph cell
const MAX_RIPPLES = 8;
const DPR_MAX = 2;
const MONO = `ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`;

/* Sparse→dense ramp; tile 0 (space) is never picked. A few mid slots are
 * swapped for runes when the client's mono font can draw them. */
const GLYPHS = [
  " ", "·", ":", "-", "~", "=", "+", "*",
  "x", "o", "a", "s", "c", "e", "%", "@",
];
const RUNE_SLOTS: [number, string][] = [
  [9, "ᚠ"],
  [11, "ᚱ"],
  [13, "ᛋ"],
];

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  u_res;                          // canvas size, device px
uniform float u_time;                         // seconds
uniform float u_cell;                         // cell size, device px
uniform sampler2D u_atlas;                    // R8 glyph strip
uniform int   u_atlasN;
uniform vec4  u_mark;                         // x,y,w,h device px, y from bottom
uniform sampler2D u_markTex;                  // r = stones, g = host stone
uniform vec4  u_ripples[${MAX_RIPPLES}];      // x, y, t0, seed (t0 < 0 = unused)
uniform vec3  u_colBase;
uniform vec3  u_colPeak;
uniform vec3  u_colGlod;

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1, 0)), u.x),
    mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), u.x),
    u.y);
}

float fbm(vec2 p) {
  return 0.55 * vnoise(p)
       + 0.30 * vnoise(p * 2.03 + 11.3)
       + 0.15 * vnoise(p * 4.07 + 27.7);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 cid  = floor(frag / u_cell);
  vec2 cuv  = fract(frag / u_cell);
  float t   = u_time;

  /* Cloud field: slow drift through domain-warped value noise. Sampled per
   * cell so every glyph in a cell shares the cloud value. */
  /* Scale tied to CSS px (cell-invariant): 0.085 at the old 16px cell. */
  vec2 q = cid * 0.053;
  vec2 warp = vec2(
    vnoise(q * 0.7 + vec2(t * 0.050, 0.0)),
    vnoise(q * 0.7 + vec2(0.0, t * 0.040) + 19.7));
  float v = fbm(q + warp * 0.9 + vec2(t * 0.100, t * 0.042));
  v = clamp(v + (hash21(cid) - 0.5) * 0.18, 0.0, 1.0);

  /* Shockwaves: noise-wobbled expanding ring plus a smaller echo band. The
   * seed makes each click's speed, width and wobble differ. */
  float I = 0.0;
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 rp = u_ripples[i];
    float age = t - rp.z;
    if (rp.z < 0.0 || age < 0.0) continue;
    float seed = rp.w;
    float speedMul = 0.75 + fract(seed * 7.13) * 0.5;
    float sig = 52.0 * (0.7 + fract(seed * 3.71) * 0.6);
    float r = age * speedMul * max(u_res.x, u_res.y) * 0.62;
    vec2 dc = (cid + 0.5) * u_cell - rp.xy;
    float d = length(dc);
    vec2 dir = dc / max(d, 1.0);
    float wob = (vnoise(dir * 2.4 + seed * 17.3) - 0.5) * 2.0 * min(r * 0.2, 70.0);
    float band = exp(-pow(d - r - wob, 2.0) / (2.0 * sig * sig));
    float echo = exp(-pow(d - r * 0.6 - wob * 0.5, 2.0) / (2.0 * sig * sig * 0.6)) * 0.5;
    float decay = exp(-age * 1.35) * smoothstep(0.0, 0.05, age);
    float reach = exp(-r * 0.0009);   // dissolve before the edge
    I += (band + echo) * decay * reach;
  }
  I = clamp(I, 0.0, 1.0);
  v = min(v + I * 0.35, 1.0);

  /* Mark mask: inside the cairn the field is always lit — Tåke stones,
   * Glød host — with a gentle internal shimmer so it stays alive. */
  vec2 mk = vec2(0.0);
  if (u_mark.z > 0.0) {
    vec2 muv = (frag - u_mark.xy) / u_mark.zw;
    if (muv.x > 0.0 && muv.x < 1.0 && muv.y > 0.0 && muv.y < 1.0)
      mk = texture(u_markTex, vec2(muv.x, 1.0 - muv.y)).rg;
  }
  float inMark = mk.r + mk.g;
  float inHost = mk.g;
  float markV = 0.78 + 0.22 * vnoise(cid * 0.22 + vec2(t * 0.05, -t * 0.04));
  v = mix(v, markV, inMark);

  /* Glyph selection: per-cell hash picks the char, cloud value biases it
   * denser — peaks literally become heavier type. */
  float vis  = smoothstep(0.36, 0.60, v);
  float peak = smoothstep(0.72, 0.94, v);
  float h = hash21(cid * 1.31 + 7.7);
  int idx = clamp(
    1 + int(floor((h * 0.6 + v * 0.5) * float(u_atlasN - 1))),
    1, u_atlasN - 1);

  vec3 col = mix(u_colBase, u_colPeak, peak);
  /* Inside the mark the ramp floor lifts to mid-gray: stones are clearly
   * lighter than the field's darkest chars, still never pinned white. */
  col = mix(col, mix(u_colBase, u_colPeak, 0.45 + 0.55 * peak), inMark);
  col = mix(col, u_colGlod, inHost);
  col = mix(col, u_colGlod, clamp(I * 1.5, 0.0, 0.95));

  /* Field dissolves toward the section's bottom edge; the mark is exempt
   * so the cairn never fades into the next section (it sits low on mobile). */
  float fadeUp = smoothstep(0.02 * u_res.y, 0.40 * u_res.y, frag.y);
  float a = texture(u_atlas,
      vec2((float(idx) + cuv.x) / float(u_atlasN), 1.0 - cuv.y)).r;
  /* Slow per-cell shimmer so the field breathes between cloud passes. */
  float tw = 0.86 + 0.14 * vnoise(cid * 0.31 + vec2(t * 0.50, t * 0.34));
  float alpha = a * (((vis * 0.34 + peak * 0.46) * tw + I * 1.15) * fadeUp
                     + inMark * (0.85 + I * 1.15));

  fragColor = vec4(col * alpha, alpha);   // premultiplied
}`;

const COL = {
  base: [0.42, 0.38, 0.36], // skifer, faint
  peak: [0.96, 0.94, 0.93], // papir
  glod: [1.0, 0.357, 0.122],
};

function drawGlyphProbe(ch: string, font: string): string {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.font = font;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillStyle = "#fff";
  x.fillText(ch, 16, 17);
  return x.getImageData(0, 0, 32, 32).data.join(",");
}

/** Charset with runes swapped in only where the mono font renders them —
 *  compared against the tofu box of a guaranteed-missing codepoint. */
function resolveGlyphSet(): string[] {
  const set = [...GLYPHS];
  try {
    const font = `500 44px ${MONO}`;
    const tofu = drawGlyphProbe("\u{10FFFE}", font);
    for (const [slot, rune] of RUNE_SLOTS) {
      const img = drawGlyphProbe(rune, font);
      if (img !== tofu && img !== drawGlyphProbe(" ", font)) set[slot] = rune;
    }
  } catch {
    /* canvas readback blocked — keep latin set */
  }
  return set;
}

function makeAtlas(gl: WebGL2RenderingContext): WebGLTexture {
  const set = resolveGlyphSet();
  const T = 64;
  const c = document.createElement("canvas");
  c.width = set.length * T;
  c.height = T;
  const x = c.getContext("2d")!;
  x.font = `500 46px ${MONO}`;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillStyle = "#fff";
  set.forEach((g, i) => x.fillText(g, i * T + T / 2, T * 0.54));

  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, c);
  return tex;
}

/** Mark mask: red = every stone, green = host stone (repainted over red). */
function makeMarkMask(gl: WebGL2RenderingContext): WebGLTexture {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const x = c.getContext("2d")!;
  try {
    x.filter = "blur(1.2px)"; // soft silhouette edge; ignored on old Safari
  } catch {
    /* no filter support */
  }
  x.fillStyle = "#f00";
  for (const s of MARK_STONES) x.fill(new Path2D(s.d));
  const host = MARK_STONES.find((s) => s.host);
  if (host) {
    x.fillStyle = "#0f0";
    x.fill(new Path2D(host.d));
  }

  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, c);
  return tex;
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(sh) ?? "shader compile failed");
  return sh;
}

export function AsciiClouds({
  markSelector = "#vd-hero-mark",
  className = "",
}: {
  /** CSS selector for the element the glyph cairn is drawn into. */
  markSelector?: string;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    const section = host?.parentElement;
    if (!canvas || !host || !section) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) return; // gradient + SVG mark are the fallback

    let dead = false;
    let raf = 0;
    let visible = true;
    let dpr = 1;
    let markSvg: SVGGraphicsElement | null = null;
    const loc: Record<string, WebGLUniformLocation | null> = {};
    const ripples = new Float32Array(MAX_RIPPLES * 4).fill(-1);
    let slot = 0;

    const render = (now: number) => {
      gl.uniform1f(loc.u_time!, now / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const measureMark = () => {
      const m = document.querySelector(markSelector);
      if (!m) {
        gl.uniform4f(loc.u_mark!, 0, 0, 0, 0);
        return;
      }
      const sr = section.getBoundingClientRect();
      const mr = m.getBoundingClientRect();
      const x = (mr.left - sr.left) * dpr;
      const yTop = (mr.top - sr.top) * dpr;
      const w = mr.width * dpr;
      const h = mr.height * dpr;
      gl.uniform4f(loc.u_mark!, x, canvas.height - yTop - h, w, h);
    };

    const resize = () => {
      const r = section.getBoundingClientRect();
      // Snap dpr to 0.25 steps and round the device-px cell — crisp cells.
      dpr = Math.floor(Math.min(devicePixelRatio || 1, DPR_MAX) * 4) / 4 || 1;
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(loc.u_res!, canvas.width, canvas.height);
      gl.uniform1f(loc.u_cell!, Math.round(CELL * dpr));
      measureMark();
      if (reduced) render(0); // static frame
    };

    /* All GL objects die on context loss, so the whole setup lives in
       init() — program, textures, uniforms — re-run on restore. */
    const init = () => {
      const program = gl.createProgram()!;
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(program) ?? "link failed");
      gl.useProgram(program);

      const U = (n: string) => gl.getUniformLocation(program, n);
      for (const n of [
        "u_res", "u_time", "u_cell", "u_atlasN", "u_mark", "u_ripples[0]",
        "u_colBase", "u_colPeak", "u_colGlod", "u_atlas", "u_markTex",
      ])
        loc[n] = U(n);

      gl.activeTexture(gl.TEXTURE0);
      makeAtlas(gl);
      gl.activeTexture(gl.TEXTURE1);
      makeMarkMask(gl);
      gl.uniform1i(loc.u_atlas!, 0);
      gl.uniform1i(loc.u_markTex!, 1);
      gl.uniform1i(loc.u_atlasN!, GLYPHS.length);
      gl.uniform3fv(loc.u_colBase!, COL.base);
      gl.uniform3fv(loc.u_colPeak!, COL.peak);
      gl.uniform3fv(loc.u_colGlod!, COL.glod);
      gl.uniform4fv(loc["u_ripples[0]"]!, ripples); // t0 = -1 → skipped

      /* The field draws the cairn — retire the SVG fallback. */
      const m = document.querySelector(markSelector);
      markSvg = m?.querySelector("svg") ?? null;
      if (markSvg) {
        markSvg.style.transition = "opacity .3s";
        markSvg.style.opacity = "0";
      }
      resize();
    };
    try {
      init();
    } catch (e) {
      console.warn("ascii-clouds: shader setup failed", e);
      return;
    }

    /* Show the SVG again whenever the field cannot draw — unmount, or a
       lost context waiting on restore. */
    const restoreMark = () => {
      if (markSvg) {
        markSvg.style.transition = "";
        markSvg.style.opacity = "";
      }
    };

    const onDown = (e: PointerEvent) => {
      const sr = section.getBoundingClientRect();
      ripples.set(
        [
          (e.clientX - sr.left) * dpr,
          canvas.height - (e.clientY - sr.top) * dpr,
          performance.now() / 1000,
          Math.random() * 100,
        ],
        slot * 4,
      );
      slot = (slot + 1) % MAX_RIPPLES;
      gl.uniform4fv(loc["u_ripples[0]"]!, ripples);
    };

    const tick = (now: number) => {
      raf = 0;
      if (dead || !visible) return;
      render(now);
      raf = requestAnimationFrame(tick);
    };

    const onLost = (e: Event) => {
      e.preventDefault();
      dead = true;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      restoreMark(); // field can't draw until the context is back
    };
    const onRestored = () => {
      try {
        init();
      } catch (e) {
        console.warn("ascii-clouds: restore failed", e);
        return; // dead stays true; SVG mark remains visible
      }
      dead = false;
      if (reduced) render(0);
      else if (visible && !raf) raf = requestAnimationFrame(tick);
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    if (reduced) {
      const roStatic = new ResizeObserver(resize);
      roStatic.observe(section);
      return () => {
        roStatic.disconnect();
        canvas.removeEventListener("webglcontextlost", onLost);
        canvas.removeEventListener("webglcontextrestored", onRestored);
        restoreMark();
      };
    }

    section.addEventListener("pointerdown", onDown);
    const ro = new ResizeObserver(resize);
    ro.observe(section);
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(tick);
      },
      { threshold: 0 },
    );
    io.observe(canvas);
    raf = requestAnimationFrame(tick);

    return () => {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      section.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      restoreMark();
      // No loseContext(): StrictMode re-runs this effect on the same canvas
      // element; a lost context would come back dead on the second mount.
    };
  }, [markSelector]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
    >
      <canvas ref={ref} className="block h-full w-full" />
    </div>
  );
}
