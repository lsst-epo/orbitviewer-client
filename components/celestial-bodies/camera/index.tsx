"use client";

import {
  useEffect,
  useRef,
  type FunctionComponent,
  type RefObject,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Vector3 } from "three";
import { lerp } from "@/lib/math";

/**
 * Scene camera and its controls.
 *
 * Ported from `gfx/core/CameraManager.ts`, which hand-rolled pointer, wheel
 * and pinch handling on top of three's OrbitControls. drei's <OrbitControls>
 * already covers that, so this keeps only what was genuinely bespoke: the
 * distance limits, the damping feel, and following a target.
 */

/** Distance limits in scene units (1000 units = 1 AU). */
export const CAMERA_LIMITS = {
  min: 24,
  max: 3_000_000,
};

/**
 * Near/far planes. The scene spans roughly 24 to 3,000,000 units, far too
 * wide for a 32-bit depth buffer -- hence the logarithmic depth buffer on the
 * Canvas, which is what makes this range usable at all.
 */
export const CAMERA_CLIP = {
  near: 0.01,
  far: CAMERA_LIMITS.max + 5_000_000,
};

export const DEFAULT_CAMERA_POSITION = new Vector3(0, 5000, 10000);

/** Per-frame easing toward a target. Matches the legacy's cameraTarget.alpha. */
const FOLLOW_EASING = 0.036;

/** Midpoint of the object's near/far framing range. */
const DEFAULT_TARGET_ZOOM = 0.5;

/**
 * Viewing distance is framed relative to the body's own radius, so a planet
 * and a kilometre-wide asteroid both fill a comparable part of the screen.
 * Ported from SolarElement's lockedObjectDistance.
 */
const FRAMING = {
  desktop: { min: 3, max: 8 },
  mobile: { min: 5, max: 15 },
};

/** Below this distance from the target, user control is handed back. */
const ARRIVAL_THRESHOLD = 0.5;

export interface CameraTarget {
  /** Live world position. Written every frame by the focused body. */
  position: Vector3;
  /** Body radius in scene units, used to frame the shot. */
  radius: number;
}

export interface CameraProps {
  /**
   * Target to follow, or null to return to free orbit. A ref rather than a
   * value because the body is moving: the camera needs its position this
   * frame, not the one from the last React render.
   */
  targetRef?: RefObject<CameraTarget | null>;
  enabled?: boolean;
}

const Camera: FunctionComponent<CameraProps> = ({
  targetRef,
  enabled = true,
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  // Set the initial vantage point once, rather than through <Canvas camera>,
  // so remounting the controls does not snap the user's view back.
  useEffect(() => {
    camera.position.copy(DEFAULT_CAMERA_POSITION);
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const target = targetRef?.current ?? null;

    if (target) {
      const framing = size.width <= 768 ? FRAMING.mobile : FRAMING.desktop;
      const near = target.radius * framing.min;
      const far = target.radius * framing.max;
      const distance = lerp(near, far, 1 - DEFAULT_TARGET_ZOOM);

      // Following works by easing the orbit pivot onto the body and closing
      // the distance limits around it: OrbitControls then pulls the camera in
      // on its own, which is how the legacy produced its fly-to.
      controls.target.lerp(target.position, FOLLOW_EASING);
      controls.minDistance = lerp(
        controls.minDistance,
        distance,
        FOLLOW_EASING
      );
      controls.maxDistance = lerp(
        controls.maxDistance,
        distance,
        FOLLOW_EASING
      );

      // Hand control back only once the pivot has essentially arrived;
      // dragging mid-flight fights the easing.
      controls.enabled =
        enabled &&
        controls.target.distanceTo(target.position) < ARRIVAL_THRESHOLD;
    } else {
      controls.minDistance = lerp(
        controls.minDistance,
        CAMERA_LIMITS.min,
        FOLLOW_EASING
      );
      controls.maxDistance = lerp(
        controls.maxDistance,
        CAMERA_LIMITS.max,
        FOLLOW_EASING
      );
      controls.enabled = enabled;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={enabled}
      makeDefault
      // Damping gives the drift the legacy applied by lerping toward its
      // target every frame.
      enableDamping
      dampingFactor={0.06}
      // Panning away from the sun loses the frame of reference, and the
      // legacy controls did not offer it either.
      enablePan={false}
      minDistance={CAMERA_LIMITS.min}
      maxDistance={CAMERA_LIMITS.max}
      zoomSpeed={0.8}
      rotateSpeed={0.5}
    />
  );
};

export default Camera;
