"use client";
import { useMemo, useEffect } from "react";
import { useTexture } from "@react-three/drei";
import { MeshStandardMaterial, SRGBColorSpace } from "three";
import vertexPars from "./planet_pars.vert";
import vertexMain from "./vert.glsl";
import fragment from "./body.frag";
import { composeShader } from "@/lib/shaders";
import { useCloudTexture } from "@/components/effects/clouds";
import night from "./textures/earth_night.webp";
import normal from "./textures/earth_normal.webp";

/** Functional equivalent of PlanetMaterial; reuse Three's lighting uniforms
 * and vertex pipeline, then attach the original planetary fragment source.
 */
export function EarthMaterial({ texture }: { texture: string }) {
  const [map, nightMap, normalMap] = useTexture(
    [texture, night.src, normal.src],
    (loaded) => {
      if (Array.isArray(loaded)) {
        loaded[0].colorSpace = SRGBColorSpace;
        loaded[1].colorSpace = SRGBColorSpace;
      }
    },
  );
  const clouds = useCloudTexture();
  const material = useMemo(() => {
    const result = new MeshStandardMaterial({ map, normalMap, roughness: 1 });
    result.onBeforeCompile = (shader) => {
      shader.vertexShader =
        "#define EARTH\n" +
        shader.vertexShader
          .replace("#include <clipping_planes_pars_vertex>", vertexPars)
          .replace("#include <fog_vertex>", vertexMain);
      shader.fragmentShader = "#define EARTH\n" + composeShader(fragment);
      Object.assign(shader.uniforms, {
        isGlow: { value: false },
        hasGlow: { value: true },
        nightMap: { value: nightMap },
        cloudsMap: { value: clouds },
        time: { value: 0 },
      });
    };
    result.customProgramCacheKey = () => "orbitviewer-earth";
    return result;
  }, [map, nightMap, normalMap, clouds]);
  useEffect(() => {
    return () => material.dispose();
  }, [map, nightMap, material]);
  return <primitive object={material} attach="material" />;
}
export function BodyMaterial({ texture }: { texture: string }) {
  const map = useTexture(texture, (loaded) => {
    if (!Array.isArray(loaded)) loaded.colorSpace = SRGBColorSpace;
  });
  return <meshStandardMaterial map={map} roughness={1} />;
}
