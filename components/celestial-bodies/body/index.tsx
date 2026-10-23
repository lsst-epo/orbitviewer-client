"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { type Group, type Mesh } from "three";
import type { OrbitRecord } from "@/lib/api/hasura";
import { DEG, objectId, orbitPosition } from "@/lib/solar/orbits";
import { ObjectLabel } from "@/components/molecules/ObjectLabel";
import { useExplorer } from "@/contexts/ExplorerProvider";
import { BodyMaterial, EarthMaterial } from "./material";
import { SaturnRings } from "@/components/models/saturn-rings";
import { Atmosphere } from "@/components/effects/atmosphere";
import mercury from "./textures/mercury.webp";
import venus from "./textures/venus.webp";
import earth from "./textures/earth.webp";
import mars from "./textures/mars.webp";
import jupiter from "./textures/jupiter.webp";
import saturn from "./textures/saturn.webp";
import uranus from "./textures/uranus.webp";
import neptune from "./textures/neptune.webp";

const textures: Record<string, string> = {
  mercury: mercury.src,
  venus: venus.src,
  earth: earth.src,
  mars: mars.src,
  jupiter: jupiter.src,
  saturn: saturn.src,
  uranus: uranus.src,
  neptune: neptune.src,
};
const radii: Record<string, number> = {
  sun: 0.12,
  mercury: 0.018,
  venus: 0.03,
  earth: 0.032,
  mars: 0.024,
  jupiter: 0.09,
  saturn: 0.075,
  uranus: 0.055,
  neptune: 0.053,
};
export const bodyRadius = (id: string) => radii[id] ?? 0.015;

const rotations: Record<
  string,
  { axialTilt: number; period: number; meridian: number }
> = {
  mercury: {
    axialTilt: 0.034,
    period: 58.6462,
    meridian: 329.5988,
  },
  venus: {
    axialTilt: 177.36,
    period: 243.018,
    meridian: 160.2,
  },
  earth: {
    axialTilt: 23.4392811,
    period: 0.9972685185,
    meridian: 0,
  },
  mars: {
    axialTilt: 25.19,
    period: 1.02595676,
    meridian: 176.049863,
  },
  jupiter: {
    axialTilt: 3.13,
    period: 0.41354,
    meridian: 284.95,
  },
  saturn: {
    axialTilt: 26.73,
    period: 0.44401,
    meridian: 38.9,
  },
  uranus: {
    axialTilt: 97.77,
    period: 0.71833,
    meridian: 203.81,
  },
  neptune: {
    axialTilt: 28.32,
    period: 0.67125,
    meridian: 249.978,
  },
};

/** Positions stay in AU; display radii are enlarged so objects remain usable.
 * Texture URLs will come from Craft once its element texture field exists.
 */
export function Body({ record }: { record: OrbitRecord }) {
  const { mjd, rotationMjd, select, entries, selectedId, categoryPalette } =
    useExplorer();
  const group = useRef<Group>(null);
  const mesh = useRef<Mesh>(null);
  const axis = useRef<Group>(null);
  const id = objectId(record);
  const texture = textures[id];
  const name =
    entries.find(
      (entry) =>
        entry.elementID === id || entry.elementID === record.fulldesignation,
    )?.title ??
    record.id ??
    record.fulldesignation;
  useFrame(() => {
    if (group.current) orbitPosition(record, mjd, group.current.position);
    if (mesh.current) {
      const spin = rotations[id];
      mesh.current.rotation.y = spin
        ? ((rotationMjd / spin.period) % 1) * Math.PI * 2 + spin.meridian * DEG
        : 0;
      if (axis.current)
        axis.current.rotation.z = spin ? -(spin.axialTilt + record.i) * DEG : 0;
    }
    // Move before camera follow (-2.5), controls (-1), and Html projection (0).
  }, -3);
  return (
    <group ref={group}>
      <group ref={axis}>
        <mesh
          ref={mesh}
          scale={bodyRadius(id)}
          onClick={(event) => {
            event.stopPropagation();
            select(id);
          }}
        >
          <sphereGeometry args={[1, 48, 32]} />
          {texture ? (
            id === "earth" ? (
              <EarthMaterial texture={texture} />
            ) : (
              <BodyMaterial texture={texture} />
            )
          ) : (
            <meshStandardMaterial color="#b3b3b3" />
          )}
          {id === "saturn" && <SaturnRings />}
          {id === "earth" && <Atmosphere />}
        </mesh>
      </group>
      <Html position={[0, 0, 0]} zIndexRange={[2, 0]}>
        <ObjectLabel
          name={name}
          types={record.object_type}
          palette={categoryPalette}
          selected={selectedId === id}
          onSelect={() => select(id)}
        />
      </Html>
    </group>
  );
}
