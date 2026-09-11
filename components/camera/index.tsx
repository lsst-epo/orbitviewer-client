"use client";
import { useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrbitControls as Controls } from "three-stdlib";
import { Vector3 } from "three";
import { useExplorer } from "@/contexts/ExplorerProvider";
import { parseCameraView } from "@/lib/solar/view";
import { orbitPosition } from "@/lib/solar/orbits";
import { bodyRadius } from "@/components/celestial-bodies/body";

/** Own camera target and follow motion without rebuilding controls each frame. */
export function Camera() {
  const { selected, selectedId, mjd, cameraAction, cameraViewRef } =
    useExplorer();
  const { camera } = useThree();
  const controls = useRef<Controls>(null);
  const previous = useRef(new Vector3());
  const initialized = useRef(false);
  useEffect(() => {
    if (!controls.current || (selectedId && selectedId !== "sun" && !selected))
      return;
    const target = selected ? orbitPosition(selected, mjd) : new Vector3();
    previous.current.copy(target);
    controls.current.target.copy(target);
    const radius = selectedId ? Math.max(0.15, bodyRadius(selectedId) * 6) : 12;
    camera.position
      .copy(target)
      .add(new Vector3(radius, radius * 0.65, radius));
    if (!initialized.current) {
      const shared = parseCameraView(
        new URLSearchParams(window.location.search),
      );
      if (shared) {
        camera.position.fromArray(shared.position);
        controls.current.target.fromArray(shared.target);
      }
      initialized.current = true;
    }
    controls.current.update();
    // Focus on selection changes, then follow its moving position in useFrame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selected, camera]);
  useEffect(() => {
    if (!controls.current || !cameraAction.revision) return;
    const target = controls.current.target;
    const offset = camera.position.clone().sub(target);
    if (cameraAction.action === "reset") {
      target.set(0, 0, 0);
      offset.set(12, 8, 12);
    } else offset.multiplyScalar(cameraAction.action === "in" ? 0.7 : 1.4);
    camera.position.copy(target).add(offset);
    controls.current.update();
  }, [cameraAction, camera]);
  useFrame(() => {
    if (!controls.current) return;
    cameraViewRef.current = {
      position: camera.position.toArray(),
      target: controls.current.target.toArray(),
    };
    if (!selected) return;
    const target = orbitPosition(selected, mjd);
    camera.position.add(target.clone().sub(previous.current));
    controls.current.target.copy(target);
    previous.current.copy(target);
  });
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      minDistance={0.05}
      maxDistance={2000}
    />
  );
}
