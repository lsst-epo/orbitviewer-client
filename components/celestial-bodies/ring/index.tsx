"use client";

import { useEffect, useMemo, type FunctionComponent } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import {
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  type BufferGeometry,
} from "three";

/**
 * A planetary ring system.
 *
 * Ported from the Saturn branch of `gfx/solar/Planet.ts`, which loaded
 * `ring.glb` and swapped its material for one carrying the ring texture.
 *
 * The glb is used rather than three's `ringGeometry` because of the UVs: the
 * ring texture is a radial strip, and `ringGeometry` maps its UVs across the
 * bounding box, so the bands would smear across the annulus instead of
 * forming circles.
 *
 * Rendered as a child of the body's mesh, so it inherits the axial tilt --
 * which is the whole reason Saturn's rings sit where they do -- and the
 * radius, so its own scale is a plain multiple of the surface.
 */

const MODEL_URL = "/models/ring.glb";

/** Outer edge, in body radii. Saturn's A ring ends at about 2.27. */
const RING_SCALE = 2;

export interface RingProps {
  /** URL of the radial ring texture. */
  map: string;
}

const Ring: FunctionComponent<RingProps> = ({ map }) => {
  const { scene } = useGLTF(MODEL_URL);
  const texture = useTexture(map);

  /**
   * The geometry is lifted out of the loaded scene rather than the scene
   * being reused. `useGLTF` caches by URL, so mutating what it returns --
   * which is what the legacy did -- would reach every other consumer of the
   * same model.
   */
  const geometry = useMemo<BufferGeometry | null>(() => {
    let found: BufferGeometry | null = null;

    scene.traverse((child) => {
      if (!found && child instanceof Mesh) found = child.geometry;
    });

    return found;
  }, [scene]);

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        map: texture,
        // Lit from one side by the sun, but seen from both.
        side: DoubleSide,
        transparent: true,
        // Without this the ring's own transparent fragments occlude the far
        // half of the annulus behind it.
        depthWrite: false,
        roughness: 1,
        metalness: 0,
      }),
    [texture]
  );

  useEffect(() => () => material.dispose(), [material]);

  if (!geometry) return null;

  return (
    <mesh
      geometry={geometry}
      material={material}
      scale={RING_SCALE}
      // The glb authors the annulus in XY; the node transform that lays it
      // flat is not carried over with the bare geometry.
      rotation-x={Math.PI / 2}
      // Rings are not a selectable body; clicks belong to the planet.
      raycast={() => null}
    />
  );
};

useGLTF.preload(MODEL_URL);

export default Ring;
