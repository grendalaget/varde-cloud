"use client";

import { useSyncExternalStore } from "react";
import {
  FilmGrain,
  FloatingParticles,
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
      {/* Faint warm pool under the cairn (right side on md+) */}
      <RadialGradient
        colorA="#ff5b1f"
        colorB="#10161a"
        center={{ x: 0.72, y: 1.0 }}
        radius={0.9}
        aspect={1.7}
        colorSpace="oklch"
      />
      {/* A few faint embers drifting up; barely-there cursor reaction */}
      <FloatingParticles
        particleColor="#ffb393"
        count={90}
        particleSize={0.8}
        softness={0.6}
        speed={0.08}
        angle={270}
        angleVariance={35}
        randomness={0.3}
        twinkle={0.35}
        cursorStrength={0.15}
      />
      <FilmGrain strength={0.025} />
    </Shader>
  );
}
