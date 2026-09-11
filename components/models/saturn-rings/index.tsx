"use client";
import { useGLTF, useTexture } from "@react-three/drei";
import { DoubleSide, Mesh, MeshStandardMaterial } from "three";
import { useMemo, useEffect } from "react";
import ringTexture from "@/components/celestial-bodies/body/textures/saturn_ring.webp";

/** Clone the cached GLTF scene so mounting a second viewer cannot reparent it. */
export function SaturnRings() {
  const gltf = useGLTF("/api/assets/ring.glb");
  const texture = useTexture(ringTexture.src);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        map: texture,
        side: DoubleSide,
        transparent: true,
        depthWrite: false,
      }),
    [texture],
  );
  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((object) => {
      if (object instanceof Mesh) object.material = material;
    });
    return clone;
  }, [gltf.scene, material]);
  useEffect(() => () => material.dispose(), [material]);
  return <primitive object={scene} scale={2} />;
}
