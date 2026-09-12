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
  const flight = useRef<{
    offset: Vector3;
    destinationOffset: Vector3;
    elapsed: number;
  } | null>(null);
  useEffect(() => {
    if (!controls.current || (selectedId && selectedId !== "sun" && !selected))
      return;
    const target = selected ? orbitPosition(selected, mjd) : new Vector3();
    previous.current.copy(target);
    const radius = selectedId ? Math.max(0.15, bodyRadius(selectedId) * 6) : 12;
    const offset = camera.position.clone().sub(controls.current.target);
    const distance = new Vector3(radius, radius * 0.65, radius).length();
    flight.current = {
      offset,
      destinationOffset: offset.clone().normalize().multiplyScalar(distance),
      elapsed: 0,
    };
    if (!initialized.current) {
      const shared = parseCameraView(
        new URLSearchParams(window.location.search),
      );
      if (shared) {
        flight.current = null;
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
    flight.current = null;
    const target = controls.current.target;
    const offset = camera.position.clone().sub(target);
    if (cameraAction.action === "reset") {
      target.set(0, 0, 0);
      offset.set(12, 8, 12);
    } else offset.multiplyScalar(cameraAction.action === "in" ? 0.7 : 1.4);
    camera.position.copy(target).add(offset);
    controls.current.update();
  }, [cameraAction, camera]);
  useFrame((_, delta) => {
    if (!controls.current) return;
    const target = selected ? orbitPosition(selected, mjd) : new Vector3();
    const transition = flight.current;
    if (transition) {
      // Follow orbital displacement exactly, even during a flight. Easing this
      // motion makes each clock tick kick the object away from the camera target.
      controls.current.target.add(target.clone().sub(previous.current));
      // Legacy CameraManager.alpha = .036 per frame. Normalize to 60 Hz so
      // pan and zoom have the same easing on displays with different refresh rates.
      const elapsed = Math.min(delta, 0.1);
      const alpha = 1 - Math.pow(1 - 0.036, elapsed * 60);
      transition.elapsed += elapsed;
      controls.current.target.lerp(target, alpha);
      transition.offset.lerp(transition.destinationOffset, alpha);
      camera.position.copy(controls.current.target).add(transition.offset);
      if (transition.elapsed >= 6) {
        controls.current.target.copy(target);
        camera.position.copy(target).add(transition.destinationOffset);
        flight.current = null;
      }
      previous.current.copy(target);
      return;
    }
    if (!selected) return;
    const motion = target.clone().sub(previous.current);
    camera.position.add(motion);
    controls.current.target.add(motion);
    previous.current.copy(target);
    // Follow before OrbitControls updates orientation and damping (-1).
  }, -2.5);
  useFrame(() => {
    if (!controls.current) return;
    cameraViewRef.current = {
      position: camera.position.toArray(),
      target: controls.current.target.toArray(),
    };
  }, -0.5);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      onStart={() => {
        flight.current = null;
      }}
      enableDamping
      minDistance={0.05}
      maxDistance={2000}
    />
  );
}
