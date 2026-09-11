"use client";

import { useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Texture } from "three";
import { useSolarClock } from "@/contexts/SolarClock";
import { GFX_TIERS, type SimQuality } from "@/lib/solar/quality";
import { CloudsTexture } from "./cloudsTexture";

/**
 * Drives the procedural cloud layer and hands back its texture.
 *
 * Created inside the effect that disposes it, for the reason documented in
 * the solar particle system: a useMemo would survive a StrictMode remount
 * while its cleanup had already freed the GPU resources.
 *
 * Priority -1 so the texture is regenerated before the compositor draws the
 * frame that samples it.
 */
export function useEarthClouds(quality: SimQuality): Texture | null {
  const gl = useThree((state) => state.gl);
  const { getSimulationTime } = useSolarClock();
  const [clouds, setClouds] = useState<CloudsTexture | null>(null);

  const width = GFX_TIERS[quality].cloudsWidth;

  useEffect(() => {
    const instance = new CloudsTexture(width);
    setClouds(instance);

    return () => {
      instance.dispose();
      setClouds((current) => (current === instance ? null : current));
    };
  }, [width]);

  useFrame(() => {
    clouds?.render(gl, getSimulationTime());
  }, -1);

  return clouds?.texture ?? null;
}

export { CloudsTexture };
