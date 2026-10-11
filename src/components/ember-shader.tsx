"use client";

import { useSyncExternalStore } from "react";
import {
  FilmGrain,
  FloatingParticles,
  Godrays,
  RadialGradient,
  Shader,
  SolidColor,
} from "shaders/react";

function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(prefers-reduced-motion: reduce)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    // Server snapshot "reduced" → renders nothing on SSR/first paint; the
    // client then mounts the shader on the next pass when allowed.
    () => true,
  );
}

/**
 * WebGL ember field behind the hero: god rays + rising embers that react to
 * the cursor, over a Natt base with film grain. Reduced-motion users get the
 * CSS gradient fallback that sits underneath instead.
 */
export function EmberShader({ className }: { className?: string }) {
  if (useReducedMotion()) return null;
  return (
    <Shader className={className}>
      <SolidColor color="#10161a" />
      {/* Warm pool under the cairn (right side on md+) */}
      <RadialGradient
        colorA="#ff5b1f"
        colorB="#10161a"
        center={{ x: 0.72, y: 1.0 }}
        radius={1.05}
        aspect={1.7}
        colorSpace="oklch"
      />
      <Godrays
        center={{ x: 0.72, y: 1.02 }}
        rayColor="#ff5b1f"
        density={0.22}
        intensity={0.45}
        spotty={0.9}
        speed={0.25}
      />
      {/* Embers drifting up; they scatter gently off the cursor */}
      <FloatingParticles
        particleColor="#ffb393"
        count={420}
        particleSize={1.1}
        softness={0.4}
        speed={0.16}
        angle={270}
        angleVariance={45}
        randomness={0.35}
        twinkle={0.65}
        cursorStrength={0.35}
      />
      <FilmGrain strength={0.05} />
    </Shader>
  );
}
