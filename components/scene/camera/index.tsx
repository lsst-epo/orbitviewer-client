"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type FunctionComponent,
  type RefObject,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Vector3 } from "three";
import { lerp } from "@/lib/math";
import { useSceneControls } from "@/contexts/SceneControls";

/** Distance limits in scene units (1000 units = 1 AU). */
export const CAMERA_LIMITS = {
  min: 24,
  max: 3_000_000,
};

/** Near/far planes. Needs the Canvas's logarithmic depth buffer; see README. */
export const CAMERA_CLIP = {
  near: 0.01,
  far: CAMERA_LIMITS.max + 5_000_000,
};

export const DEFAULT_CAMERA_POSITION = new Vector3(10_000, 5_000, 0);

/** Where the splash frames the system from. */
export const LANDING_CAMERA_POSITION = new Vector3(0, 1_500, 4_000);

/** Per-frame easing toward a target. Matches the legacy's cameraTarget.alpha. */
const FOLLOW_EASING = 0.036;

/** After the bodies move, before the compositor draws. See README. */
export const CAMERA_PRIORITY = 0.5;

/** Midpoint of the object's near/far framing range. */
const DEFAULT_TARGET_ZOOM = 0.5;

/** Viewing distance as a multiple of the body's own radius. */
const FRAMING = {
  desktop: { min: 3, max: 8 },
  mobile: { min: 5, max: 15 },
};

/** Below this distance from the target, user control is handed back. */
const ARRIVAL_THRESHOLD = 0.5;

/** The pivot with nothing selected: the Sun, at the origin. */
const HOME = new Vector3(0, 0, 0);

/** Scene units per frame of held zoom, ramped by distance. */
const ZOOM_SPEED = { min: 1, max: 500 };
const ZOOM_RAMP = 10_000;

/** The recentre glide, and the distance at which it is done. */
const RECENTER_EASING = 0.08;
const RECENTER_THRESHOLD = 1;

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

/** Zoom speed at the camera's current distance. */
const zoomStep = (distance: number): number =>
  lerp(
    ZOOM_SPEED.min,
    ZOOM_SPEED.max,
    Math.min(Math.max(distance / ZOOM_RAMP, 0), 1)
  );

/** drei only updates the controls while they are enabled -- see README. */
const driveControls = (controls: OrbitControlsImpl): void => {
  if (!controls.enabled) controls.update();
};

const Camera: FunctionComponent<CameraProps> = ({
  targetRef,
  enabled = true,
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const { zoomRef, recenterRef, landing } = useSceneControls();

  /** The flight out of the splash happens once per visit. */
  const hasLeftLanding = useRef(!landing);

  const offset = useMemo(() => new Vector3(), []);

  /** Whether this target has had its distance ceiling collapsed. See README. */
  const framedTarget = useRef<CameraTarget | null>(null);

  // A layout effect, not an effect: see README, "The first frame".
  useLayoutEffect(() => {
    camera.position.copy(
      landing ? LANDING_CAMERA_POSITION : DEFAULT_CAMERA_POSITION
    );
    camera.updateProjectionMatrix();
    // Mount only: `landing` changing later is the flight below, not a jump.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);

  useEffect(() => {
    if (landing || hasLeftLanding.current) return;
    hasLeftLanding.current = true;
    recenterRef.current = true;
  }, [landing, recenterRef]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const target = targetRef?.current ?? null;

    if (recenterRef.current && target) recenterRef.current = false;

    if (recenterRef.current) {
      camera.position.lerp(DEFAULT_CAMERA_POSITION, RECENTER_EASING);
      controls.target.lerp(HOME, RECENTER_EASING);

      if (
        camera.position.distanceTo(DEFAULT_CAMERA_POSITION) < RECENTER_THRESHOLD
      ) {
        camera.position.copy(DEFAULT_CAMERA_POSITION);
        controls.target.copy(HOME);
        recenterRef.current = false;
      }
    }

    if (zoomRef.current !== 0) {
      recenterRef.current = false;

      offset.copy(camera.position).sub(controls.target);
      const distance = offset.length();
      const next = distance + zoomStep(distance) * zoomRef.current;

      camera.position
        .copy(controls.target)
        .addScaledVector(
          offset.normalize(),
          Math.min(Math.max(next, controls.minDistance), controls.maxDistance)
        );
    }

    if (target) {
      if (framedTarget.current !== target) {
        framedTarget.current = target;
        controls.maxDistance = Math.min(
          controls.maxDistance,
          camera.position.distanceTo(controls.target)
        );
      }

      const framing = size.width <= 768 ? FRAMING.mobile : FRAMING.desktop;
      const near = target.radius * framing.min;
      const far = target.radius * framing.max;
      const distance = lerp(near, far, 1 - DEFAULT_TARGET_ZOOM);

      // The lag here is the legacy's elastic tether, not a bug. Do not
      // cancel it -- see README, "The elastic tether is deliberate".
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

      controls.enabled =
        enabled &&
        controls.target.distanceTo(target.position) < ARRIVAL_THRESHOLD;

      driveControls(controls);
    } else {
      framedTarget.current = null;

      // Deselecting returns the pivot to the Sun. Without it the camera keeps
      // orbiting wherever the last body was -- see README.
      controls.target.lerp(HOME, FOLLOW_EASING);
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
      driveControls(controls);
    }
  }, CAMERA_PRIORITY);

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={enabled}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      // Panning away from the sun loses the frame of reference.
      enablePan={false}
      minDistance={CAMERA_LIMITS.min}
      maxDistance={CAMERA_LIMITS.max}
      zoomSpeed={0.8}
      rotateSpeed={0.5}
    />
  );
};

export default Camera;
