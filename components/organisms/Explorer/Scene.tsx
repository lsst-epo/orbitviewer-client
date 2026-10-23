"use client";
import { Suspense, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Composite } from "@/components/effects/composite";
import { Camera } from "@/components/camera";
import { Sun } from "@/components/celestial-bodies/sun";
import { Body } from "@/components/celestial-bodies/body";
import { OrbitPath } from "@/components/celestial-bodies/orbit-path";
import { SolarParticles } from "@/components/effects/solar-particles";
import { useExplorer } from "@/contexts/ExplorerProvider";
import { objectId } from "@/lib/solar/orbits";

function SolarScene({
  landing,
  ready,
  departing,
  onDepartureComplete,
}: {
  landing: boolean;
  ready: boolean;
  departing?: boolean;
  onDepartureComplete?: () => void;
}) {
  const { visible, selected, selectedId, showOrbits } = useExplorer();
  const bodies = visible.filter((record) => record.object_type?.includes(7));
  const small = useMemo(
    () => visible.filter((record) => !record.object_type?.includes(7)),
    [visible],
  );
  return (
    <>
      <Camera
        landing={landing}
        ready={ready}
        departing={departing}
        onDepartureComplete={onDepartureComplete}
      />
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
function FirstFrame({
  sceneReady,
  onReady,
}: {
  sceneReady: boolean;
  onReady?: () => void;
}) {
  useFrame(() => {
    if (!sceneReady) onReady?.();
  }, 2);
  return null;
}

export default function Scene({
  sceneReady = false,
  onReady,
  landing = false,
  ready = true,
  departing = false,
  onDepartureComplete,
}: {
  sceneReady?: boolean;
  onReady?: () => void;
  landing?: boolean;
  ready?: boolean;
  departing?: boolean;
  onDepartureComplete?: () => void;
}) {
  const [eventSource, setEventSource] = useState<HTMLDivElement | null>(null);
  // Keep the camera configuration stable when the route changes presentation.
  const [cameraOptions] = useState(() => ({
    position: (landing ? [0, 1.5, 4] : [12, 8, 12]) as [number, number, number],
    fov: landing ? 35 : 45,
    near: 0.001,
    far: 10000,
  }));
  return (
    <div ref={setEventSource} style={{ width: "100%", height: "100%" }}>
      {eventSource && (
        <Canvas
          eventSource={eventSource}
          camera={cameraOptions}
          dpr={[1, 1.5]}
          gl={{ antialias: true, preserveDrawingBuffer: true }}
        >
          <color attach="background" args={["#000"]} />
          <Suspense fallback={null}>
            <SolarScene
              landing={landing}
              ready={ready}
              departing={departing}
              onDepartureComplete={onDepartureComplete}
            />
            <FirstFrame sceneReady={sceneReady} onReady={onReady} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
