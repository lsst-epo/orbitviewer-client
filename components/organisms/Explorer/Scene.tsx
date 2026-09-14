"use client";
import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Composite } from "@/components/effects/composite";
import { getExplorerEntry, clearExplorerEntry } from "@/lib/solar/entry";
import type { CameraView } from "@/lib/solar/view";
import { Camera } from "@/components/camera";
import { Sun } from "@/components/celestial-bodies/sun";
import { Body } from "@/components/celestial-bodies/body";
import { OrbitPath } from "@/components/celestial-bodies/orbit-path";
import { SolarParticles } from "@/components/effects/solar-particles";
import { useExplorer } from "@/contexts/ExplorerProvider";
import { objectId } from "@/lib/solar/orbits";

function SolarScene({
  landing,
  entry,
  ready,
  departing,
  onDepartureComplete,
}: {
  landing: boolean;
  entry?: CameraView;
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
        entry={entry}
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
function FirstFrame({ onReady }: { onReady?: () => void }) {
  const ready = useRef(false);
  useFrame(() => {
    if (!ready.current) {
      ready.current = true;
      onReady?.();
    }
  }, 2);
  return null;
}

export default function Scene({
  onReady,
  landing = false,
  ready = true,
  departing = false,
  onDepartureComplete,
}: {
  onReady?: () => void;
  landing?: boolean;
  ready?: boolean;
  departing?: boolean;
  onDepartureComplete?: () => void;
}) {
  const [eventSource, setEventSource] = useState<HTMLDivElement | null>(null);
  const [entry] = useState(() => (landing ? undefined : getExplorerEntry()));
  useEffect(() => {
    if (entry) clearExplorerEntry(entry);
  }, [entry]);
  return (
    <div ref={setEventSource} style={{ width: "100%", height: "100%" }}>
      {eventSource && (
        <Canvas
          eventSource={eventSource}
          camera={{
            position: entry?.position ?? (landing ? [0, 1.5, 4] : [12, 8, 12]),
            fov: landing || entry ? 35 : 45,
            near: 0.001,
            far: 10000,
          }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, preserveDrawingBuffer: true }}
        >
          <color attach="background" args={["#000"]} />
          <Suspense fallback={null}>
            <SolarScene
              landing={landing}
              entry={entry}
              ready={ready}
              departing={departing}
              onDepartureComplete={onDepartureComplete}
            />
            <FirstFrame onReady={onReady} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
