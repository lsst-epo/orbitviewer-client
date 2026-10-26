"use client";

import { useMemo, type FunctionComponent } from "react";
import { Color } from "three";
import type { AtmosphereSettings } from "@/lib/solar/atmospheres";
import vertexShader from "./atmosphere.vert";
import fragmentShader from "./atmosphere.frag";

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
