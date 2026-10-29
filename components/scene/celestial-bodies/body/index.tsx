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
import type { CameraTarget } from "@/components/scene/celestial-bodies/camera";
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
import Atmosphere from "@/components/scene/effects/atmosphere";
import Ring from "@/components/scene/celestial-bodies/ring";
import { BodyMaterial } from "./material";
import { textureSetFor } from "./textures";

export interface BodyProps {
  elements: OrbitElements;
  /** Physical radius in km. */
  radiusKm: number;
  /** Radius multiplier: bodies are microscopic at true scale. */
  radiusScale?: number;
  /** Mean anomalies of the giants, for Schlyter's perturbation terms. */
  perturbations?: PerturbationContext;
  /** Procedural cloud layer, generated once for the whole scene. */
  cloudsMap?: Texture | null;
  /** When set, this body writes its live position here each frame. */
  focusRef?: React.RefObject<CameraTarget | null> | null;
  onClick?: (id: string) => void;
  /** Identifier handed to `onClick`, and so the one that lands in the URL. */
  selectId?: string;
  /** Floating name beside the body. */
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
    group.position.copy(position);

    if (focusRef?.current) {
      focusRef.current.position.copy(position);
      focusRef.current.radius = radius;
    }

    if (rotation) {
      const elapsedSeconds = dateRef.current.getTime() * 0.001;
      const turns = elapsedSeconds / (rotation.period * DAYS_TO_SECONDS);
      mesh.rotation.y = rotation.meridian * DEG_TO_RAD + turns * Math.PI * 2;
    }

    materialRef.current?.updateTime(getSimulationTime());
  });

  const atmosphere = atmosphereFor(id);

  /** Axial tilt, on the group ABOVE the spinning mesh -- see README. */
  const axisTilt = rotation
    ? -(rotation.axialTilt + elements.i) * DEG_TO_RAD
    : 0;

  return (
    // Position on the group, rotation on the mesh: the label must not be
    // swung around by the body's spin, and tilt and spin cannot share an
    // object -- see README.
    <group ref={groupRef}>
      <group rotation-z={axisTilt}>
        <mesh
          ref={meshRef}
          scale={radius}
          onClick={onClick ? () => onClick(selectId ?? elements.id) : undefined}
          // TODO: no-op as written -- drop it, or give bodies a real hit
          // target. See README.
          raycast={undefined}
        >
          <sphereGeometry args={[1, 64, 32]} />
          <primitive object={material} ref={materialRef} attach="material" />
          {/* Nested so the shell inherits the body's radius; its own scale
              is then a plain multiple of the surface. */}
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
