"use client";

import { useMemo, type FunctionComponent } from "react";
import { Color } from "three";
import type { AtmosphereSettings } from "@/lib/solar/atmospheres";
import vertexShader from "./atmosphere.vert";
import fragmentShader from "./atmosphere.frag";

/**
 * A body's atmospheric shell.
 *
 * Ported from `getAtmosphereMaterial` / `initAtmosphere` in
 * `gfx/solar/Planet.ts`. A slightly larger sphere around the body, rendering
 * only a fresnel rim: the shader discards everything but the grazing-angle
 * band, so the sphere reads as a halo of air rather than a second surface.
 *
 * `depthWrite` is off. The shell sits in front of the body it belongs to, and
 * writing depth would make it occlude the surface it is meant to sit on.
 *
 * It declares `hasGlow`, so it contributes to the compositor's bloom pass.
 */

export interface AtmosphereProps {
  settings: AtmosphereSettings;
}

const Atmosphere: FunctionComponent<AtmosphereProps> = ({ settings }) => {
  const uniforms = useMemo(
    () => ({
      color1: { value: new Color(settings.color1) },
      color2: { value: new Color(settings.color2) },
      fresnelWidth: { value: settings.fresnelWidth },
      brightness: { value: settings.brightness },
      hasGlow: { value: true },
      isGlow: { value: false },
    }),
    [settings]
  );

  return (
    <mesh scale={settings.scale}>
      <sphereGeometry args={[1, 64, 32]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
};

export default Atmosphere;
