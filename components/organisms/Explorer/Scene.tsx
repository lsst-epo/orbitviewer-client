"use client";
import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Composite } from "@/components/effects/composite";
import { Camera } from "@/components/camera";
import { Sun } from "@/components/celestial-bodies/sun";
import { Body } from "@/components/celestial-bodies/body";
import { OrbitPath } from "@/components/celestial-bodies/orbit-path";
import { SolarParticles } from "@/components/effects/solar-particles";
import { useExplorer } from "@/contexts/ExplorerProvider";
import { objectId } from "@/lib/solar/orbits";

function SolarScene() {
  const { visible, selected, selectedId, showOrbits } = useExplorer();
  const bodies = visible.filter((record) => record.object_type?.includes(7));
  const small = useMemo(
    () => visible.filter((record) => !record.object_type?.includes(7)),
    [visible],
  );
  return (
    <>
      <Camera />
      <Composite />
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={6} decay={0} />
      <Sun />
      {bodies.map((record) => (
        <Body key={objectId(record)} record={record} />
      ))}
      {showOrbits &&
        bodies.map((record) => (
          <OrbitPath
            key={objectId(record)}
            record={record}
            selected={objectId(record) === selectedId}
          />
        ))}
      <SolarParticles records={small} />
      {selected &&
        visible.includes(selected) &&
        !selected.object_type?.includes(7) && (
          <>
            <Body record={selected} />
            <OrbitPath record={selected} selected />
          </>
        )}
    </>
  );
}
export default function Scene() {
  return (
    <Canvas
      camera={{ position: [12, 8, 12], fov: 45, near: 0.001, far: 10000 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
    >
      <color attach="background" args={["#000"]} />
      <Suspense fallback={null}>
        <SolarScene />
      </Suspense>
    </Canvas>
  );
}
