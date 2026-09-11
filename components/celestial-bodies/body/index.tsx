"use client";

import { useEffect, useMemo, useRef, type FunctionComponent } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Mesh, Vector3 } from "three";
import { AU2KM, DEG_TO_RAD, KM2AU, PLANET_SCALE } from "@/lib/solar/constants";
import { calculateOrbit, type PerturbationContext } from "@/lib/solar/orbits";
import type { OrbitElements } from "@/lib/solar/types";
import {
  PlanetRotationMap,
  isPlanetId,
  type PlanetRotationData,
} from "@/lib/solar/planets";
import { useSolarClock } from "@/contexts/SolarClock";
import { BodyMaterial } from "./material";
import { textureSetFor } from "./textures";

/**
 * A generalised celestial body.
 *
 * Ported from `gfx/solar/Planet.ts`, which was a Three.js class bound to the
 * eight planets. This takes orbital elements plus a radius and renders any
 * solid body, so the same component covers planets, dwarf planets and
 * eventually anything Craft describes.
 *
 * Position is recomputed every frame from the simulation clock and written
 * straight to the mesh, never through React state -- re-rendering per frame
 * would be far too expensive.
 */

export interface BodyProps {
  elements: OrbitElements;
  /** Physical radius in km. */
  radiusKm: number;
  /**
   * Radius multiplier. Bodies are microscopic at true scale (Earth is 4e-5 AU
   * against a 30 AU scene), so the viewer exaggerates them to stay visible.
   */
  radiusScale?: number;
  /** Mean anomalies of the giants, for Schlyter's perturbation terms. */
  perturbations?: PerturbationContext;
  onClick?: (id: string) => void;
}

const DAYS_TO_SECONDS = 86400;

const Body: FunctionComponent<BodyProps> = ({
  elements,
  radiusKm,
  radiusScale = 1,
  perturbations,
  onClick,
}) => {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<BodyMaterial>(null);
  const { dateRef, getMJD } = useSolarClock();

  // Reused across frames; allocating a Vector3 per body per frame is the
  // single easiest way to make this scene stutter.
  const position = useMemo(() => new Vector3(), []);

  const id = elements.id.toLowerCase();
  const isEarth = id === "earth";
  const textures = textureSetFor(id);

  const rotation: PlanetRotationData | undefined = isPlanetId(id)
    ? PlanetRotationMap[id]
    : undefined;

  // Radius in scene units: km -> AU -> scene units.
  const radius = radiusKm * KM2AU * PLANET_SCALE * radiusScale;

  const maps = useTexture(
    [textures?.map, textures?.nightMap, textures?.normalMap].filter(
      (url): url is string => Boolean(url)
    )
  );

  const material = useMemo(() => {
    const [map, nightMap, normalMap] = Array.isArray(maps) ? maps : [maps];

    return new BodyMaterial(
      {
        map: map ?? null,
        normalMap: isEarth ? null : (normalMap ?? null),
        roughness: 1,
        metalness: 0,
      },
      {
        isEarth,
        nightMap: isEarth ? (nightMap ?? null) : null,
      }
    );
  }, [maps, isEarth]);

  // React does not dispose materials it did not create.
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const d = getMJD();

    calculateOrbit(elements, d, position, perturbations);
    mesh.position.copy(position);

    if (rotation) {
      // Axial tilt is fixed; the meridian advances with the sidereal period.
      const elapsedSeconds = dateRef.current.getTime() * 0.001;
      const turns = elapsedSeconds / (rotation.period * DAYS_TO_SECONDS);
      mesh.rotation.z = rotation.axialTilt * DEG_TO_RAD;
      mesh.rotation.y = rotation.meridian * DEG_TO_RAD + turns * Math.PI * 2;
    }

    materialRef.current?.updateTime(dateRef.current.getTime() * 0.001);
  });

  return (
    <mesh
      ref={meshRef}
      scale={radius}
      onClick={onClick ? () => onClick(elements.id) : undefined}
      // Bodies are exaggerated but still small on screen; a slightly generous
      // raycast threshold makes them selectable without pixel-hunting.
      raycast={undefined}
    >
      <sphereGeometry args={[1, 64, 32]} />
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  );
};

export default Body;

/** Physical radius of a body in km, from its AU-scaled scene radius. */
export const sceneRadiusToKm = (radius: number): number =>
  (radius / PLANET_SCALE) * AU2KM;
