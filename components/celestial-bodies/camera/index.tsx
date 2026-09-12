"use client";

import {
  useEffect,
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

/** The pivot with nothing selected: the Sun, at the origin. */
const HOME = new Vector3(0, 0, 0);

/**
 * Scene units moved per frame of held zoom, by how far out the camera is.
 *
 * Ported from the legacy's ZOOM_SPEED, interpolated over the same 0-10,000
 * unit span: a fixed step would crawl out at the edge of the system and
 * overshoot wildly near a planet.
 */
const ZOOM_SPEED = { min: 1, max: 500 };
const ZOOM_RAMP = 10_000;

/**
 * Easing for the recentre glide, and the distance at which it is done.
 *
 * Eased rather than snapped: the legacy tweened this over two to three
 * seconds, and jumping the camera across the system in one frame loses the
 * reader's sense of where they were.
 */
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

const Camera: FunctionComponent<CameraProps> = ({
  targetRef,
  enabled = true,
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const { zoomRef, recenterRef } = useSceneControls();

  // Scratch, reused per frame.
  const offset = useMemo(() => new Vector3(), []);

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

    /**
     * Recentre. Ignored while a body is followed: the camera is already
     * framing what the reader asked for, and the legacy's `centerView`
     * likewise only reset the zoom level in that case.
     */
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

    /**
     * Held zoom, from the on-screen buttons. Applied by moving the camera
     * along its line of sight rather than through OrbitControls' own dolly,
     * which is private in three's build and not reachable from here.
     */
    if (zoomRef.current !== 0) {
      // Taking manual control cancels a glide in progress, rather than the
      // two fighting each other.
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
      // Deselecting returns the pivot to the Sun, as the legacy's
      // `releaseCameraTarget` did by calling `centerView`. Without it the
      // camera keeps orbiting wherever the last body was -- deselect Eris and
      // you are left circling an empty point 68 AU out. Panning is disabled,
      // so nothing competes with this.
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
