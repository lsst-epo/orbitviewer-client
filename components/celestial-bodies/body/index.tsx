"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type FunctionComponent,
  type ReactNode,
} from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Group, Mesh, Vector3, type Texture } from "three";
import type { CameraTarget } from "@/components/celestial-bodies/camera";
import { AU2KM, DEG_TO_RAD, KM2AU, PLANET_SCALE } from "@/lib/solar/constants";
import { calculateOrbit, type PerturbationContext } from "@/lib/solar/orbits";
import type { OrbitElements } from "@/lib/solar/types";
import {
  PlanetRotationMap,
  isPlanetId,
  type PlanetRotationData,
} from "@/lib/solar/planets";
import { atmosphereFor } from "@/lib/solar/atmospheres";
import { useSolarClock } from "@/contexts/SolarClock";
import Atmosphere from "@/components/effects/atmosphere";
import Ring from "@/components/celestial-bodies/ring";
import { BodyMaterial } from "./material";
import { textureSetFor } from "./textures";

/**
 * A generalised celestial body, ported from `gfx/solar/Planet.ts`. Position is
 * written straight to the object every frame, never through React state.
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
  /**
   * Procedural cloud layer. Generated once for the whole scene and passed in,
   * rather than created per body -- only Earth samples it, and the noise is
   * far too expensive to evaluate thirteen times.
   */
  cloudsMap?: Texture | null;
  /**
   * When set, this body writes its live position here each frame for the
   * camera to follow. A ref rather than a callback so following costs no
   * React renders while the body orbits.
   */
  focusRef?: React.RefObject<CameraTarget | null> | null;
  onClick?: (id: string) => void;
  /**
   * Identifier handed to `onClick`, and so the one that lands in the URL.
   * Defaults to the elements' own id; the named objects override it with
   * Craft's `elementID` so that the server can resolve a shared link.
   */
  selectId?: string;
  /**
   * Floating name beside the body. Rendered here rather than in the scene so
   * it inherits the body's position without a second per-frame write.
   */
  label?: ReactNode;
}

const DAYS_TO_SECONDS = 86400;

const Body: FunctionComponent<BodyProps> = ({
  elements,
  radiusKm,
  radiusScale = 1,
  perturbations,
  cloudsMap = null,
  focusRef = null,
  onClick,
  selectId,
  label,
}) => {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<BodyMaterial>(null);
  const { dateRef, getMJD, getSimulationTime } = useSolarClock();

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
        cloudsMap: isEarth ? cloudsMap : null,
      }
    );
  }, [maps, isEarth, cloudsMap]);

  // React does not dispose materials it did not create.
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const group = groupRef.current;
    const mesh = meshRef.current;
    if (!group || !mesh) return;

    const d = getMJD();

    calculateOrbit(elements, d, position, perturbations);
    // Position on the group, rotation on the mesh: anything that should sit
    // beside the body -- its label -- must not be swung around by its spin.
    group.position.copy(position);

    if (focusRef?.current) {
      focusRef.current.position.copy(position);
      focusRef.current.radius = radius;
    }

    if (rotation) {
      // Spin only. The tilt is a fixed prop on the group above; see axisTilt.
      const elapsedSeconds = dateRef.current.getTime() * 0.001;
      const turns = elapsedSeconds / (rotation.period * DAYS_TO_SECONDS);
      mesh.rotation.y = rotation.meridian * DEG_TO_RAD + turns * Math.PI * 2;
    }

    materialRef.current?.updateTime(getSimulationTime());
  });

  const atmosphere = atmosphereFor(id);

  /**
   * Axial tilt, on the group ABOVE the spinning mesh. It cannot share an
   * object with the spin -- see README.
   */
  const axisTilt = rotation
    ? -(rotation.axialTilt + elements.i) * DEG_TO_RAD
    : 0;

  return (
    <group ref={groupRef}>
      <group rotation-z={axisTilt}>
        <mesh
          ref={meshRef}
          scale={radius}
          onClick={onClick ? () => onClick(selectId ?? elements.id) : undefined}
          // Bodies are exaggerated but still small on screen; a slightly
          // generous raycast threshold makes them selectable without
          // pixel-hunting.
          raycast={undefined}
        >
          <sphereGeometry args={[1, 64, 32]} />
          <primitive object={material} ref={materialRef} attach="material" />
          {/* Nested so the shell inherits the body's radius; its own scale is
              then a plain multiple of the surface. */}
          {atmosphere && <Atmosphere settings={atmosphere} />}
          {textures?.ringMap && <Ring map={textures.ringMap} />}
        </mesh>
      </group>
      {label}
    </group>
  );
};

export default Body;

/** Physical radius of a body in km, from its AU-scaled scene radius. */
export const sceneRadiusToKm = (radius: number): number =>
  (radius / PLANET_SCALE) * AU2KM;
