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
export function Camera({
  landing = false,
  ready = true,
  departing = false,
  onDepartureComplete,
}: {
  landing?: boolean;
  ready?: boolean;
  departing?: boolean;
  onDepartureComplete?: () => void;
}) {
  const {
    selected,
    selectedId,
    selectionMode,
    mjd,
    cameraAction,
    cameraViewRef,
  } = useExplorer();
  const { camera } = useThree();
  const controls = useRef<Controls>(null);
  const zoom = useRef<{ distance: number; direction: number } | null>(null);
  useEffect(() => {
    const stop = () => {
      zoom.current = null;
    };
    window.addEventListener("blur", stop);
    return () => window.removeEventListener("blur", stop);
  }, []);
  const previous = useRef(new Vector3());
  const initialized = useRef(false);
  const previousLanding = useRef(landing);
  const entrance = useRef<{
    from: Vector3;
    target: Vector3;
    elapsed: number;
  } | null>(null);
  const flight = useRef<{
    offset: Vector3;
    destinationOffset: Vector3;
    elapsed: number;
  } | null>(null);
  useEffect(() => {
    if (selectionMode === "orbit") {
      // Tour stops highlight the orbit without moving or following the camera.
      flight.current = null;
      entrance.current = null;
      zoom.current = null;
      return;
    }
    if (!controls.current || (selectedId && selectedId !== "sun" && !selected))
      return;
    if (entrance.current && !selectedId) return;
    const target = selected ? orbitPosition(selected, mjd) : new Vector3();
    previous.current.copy(target);
    entrance.current = null;
    zoom.current = null;
    const radius = selectedId ? Math.max(0.15, bodyRadius(selectedId) * 6) : 12;
    const offset = camera.position.clone().sub(controls.current.target);
    // Legacy landingMode uses (0, 1500, 4000), with 1000 units per AU.
    const distance =
      landing && !selectedId
        ? Math.hypot(1.5, 4)
        : new Vector3(radius, radius * 0.65, radius).length();
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
  }, [selectedId, selected, selectionMode, camera]);
  useEffect(() => {
    if (!controls.current) return;
    const enteringExplorer = previousLanding.current && !landing;
    previousLanding.current = landing;
    if (!departing) {
      // History navigation can enter Explorer without the homepage click handler.
      if (
        enteringExplorer &&
        !selectedId &&
        camera.position.distanceTo(new Vector3(10, 5, 0)) > 0.001
      ) {
        flight.current = null;
        entrance.current = {
          from: camera.position.clone(),
          target: controls.current.target.clone(),
          elapsed: 0,
        };
      }
      if (
        landing &&
        !selectedId &&
        !parseCameraView(new URLSearchParams(window.location.search))
      ) {
        camera.position.set(0, 1.5, 4);
        controls.current.target.set(0, 0, 0);
        controls.current.update();
        flight.current = null;
        entrance.current = null;
      }
      return;
    }
    flight.current = null;
    entrance.current = {
      from: camera.position.clone(),
      target: controls.current.target.clone(),
      elapsed: 0,
    };
  }, [departing, camera, landing, selectedId]);
  useEffect(() => {
    if (!controls.current || !cameraAction.revision) return;
    if (cameraAction.action === "stop") {
      zoom.current = null;
      return;
    }
    flight.current = null;
    entrance.current = null;
    const target = controls.current.target;
    if (cameraAction.action === "reset") {
      zoom.current = null;
      target.set(0, 0, 0);
      camera.position.set(12, 8, 12);
      controls.current.update();
    } else {
      const direction = cameraAction.action.startsWith("in") ? -1 : 1;
      const distance =
        zoom.current?.distance ?? camera.position.distanceTo(target);
      zoom.current = {
        distance: Math.max(
          0.05,
          Math.min(2000, distance * Math.exp(direction * 0.12)),
        ),
        direction: cameraAction.action.endsWith("-hold") ? direction : 0,
      };
    }
  }, [cameraAction, camera]);
  useFrame((_, delta) => {
    if (!controls.current) return;
    const arrival = entrance.current;
    if (arrival) {
      if (!ready) return;
      arrival.elapsed += Math.min(delta, 0.1);
      const progress = Math.min(1, arrival.elapsed / 2);
      const ease =
        progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      // Legacy centerView assigns x=10000, y=5000, z=0 (1000 units/AU).
      camera.position.copy(arrival.from).lerp(new Vector3(10, 5, 0), ease);
      controls.current.target.copy(arrival.target).multiplyScalar(1 - ease);
      if (progress === 1) {
        entrance.current = null;
        if (departing) onDepartureComplete?.();
      }
      return;
    }
    if (departing) return;
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
    const zooming = zoom.current;
    if (zooming) {
      const elapsed = Math.min(delta, 0.1);
      zooming.distance = Math.max(
        0.05,
        Math.min(
          2000,
          zooming.distance * Math.exp(zooming.direction * elapsed * 1.2),
        ),
      );
      const offset = camera.position.clone().sub(controls.current.target);
      const distance = offset.length();
      const eased =
        distance +
        (zooming.distance - distance) * (1 - Math.pow(1 - 0.036, elapsed * 60));
      camera.position
        .copy(controls.current.target)
        .add(offset.setLength(eased));
      if (!zooming.direction && Math.abs(eased - zooming.distance) < 0.00001)
        zoom.current = null;
    }
    if (!selected || selectionMode === "orbit") return;
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
        zoom.current = null;
        flight.current = null;
        entrance.current = null;
      }}
      enableDamping
      minDistance={0.05}
      maxDistance={2000}
    />
  );
}
