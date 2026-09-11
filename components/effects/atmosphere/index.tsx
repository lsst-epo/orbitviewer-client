"use client";
import { Color } from "three";
import { useMemo } from "react";
import { composeShader } from "@/lib/shaders";
import vertex from "./atmosphere.vert";
import fragment from "./atmosphere.frag";

/** Fresnel scattering shell, using the legacy atmosphere shader unchanged. */
export function Atmosphere({ color = "#aaffff" }: { color?: string }) {
  const uniforms = useMemo(
    () => ({
      color1: { value: new Color(color) },
      color2: { value: new Color(color) },
      fresnelWidth: { value: 1.35 },
      brightness: { value: 2 },
      hasGlow: { value: true },
      isGlow: { value: false },
    }),
    [color],
  );
  return (
    <mesh scale={1.05}>
      <sphereGeometry args={[1, 48, 32]} />
      <shaderMaterial
        vertexShader={composeShader(vertex)}
        fragmentShader={composeShader(fragment)}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
