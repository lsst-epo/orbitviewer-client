"use client";

import { useMemo, useRef, type FunctionComponent } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Mesh, ShaderMaterial } from "three";
import { KM2AU, PLANET_SCALE, SUN_RADIUS } from "@/lib/solar/constants";
import { useSolarClock } from "@/contexts/SolarClock";
import vertexShader from "./sun.vert";
import fragmentShader from "./sun.frag";

/**
 * The Sun.
 *
 * Ported from `gfx/solar/Sun.ts`. The shader is unchanged; what differs is
 * ownership -- the legacy class held a module-level singleton material shared
 * across instances, whereas the material here is created per instance and
 * memoised, so React owns its lifecycle and disposal.
 */

/** Sun radius in scene units. */
export const SUN_SCENE_RADIUS = SUN_RADIUS * KM2AU * PLANET_SCALE;

export interface SunProps {
  /** Multiplier on the physical radius, for the exaggerated overview scale. */
  scale?: number;
}

const Sun: FunctionComponent<SunProps> = ({ scale = 1 }) => {
  const materialRef = useRef<ShaderMaterial>(null);
  const meshRef = useRef<Mesh>(null);
  const { dateRef } = useSolarClock();

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      color1: { value: new Color(0xf4c6a1) },
      color2: { value: new Color(0xc76537) },
      fresnelWidth: { value: 1.9 },
      brightness: { value: 1.3 },
      hasGlow: { value: true },
      isGlow: { value: false },
    }),
    []
  );

  useFrame(() => {
    if (!materialRef.current) return;
    // The surface shader animates against simulation time, so scrubbing the
    // clock scrubs the granulation with it.
    materialRef.current.uniforms.time.value = dateRef.current.getTime() * 0.001;
  });

  return (
    <mesh ref={meshRef} scale={SUN_SCENE_RADIUS * scale}>
      <sphereGeometry args={[1, 64, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

export default Sun;
