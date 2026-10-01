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

/**
 * Frame order: after the bodies have moved, before the compositor draws.
 *
 * Following reads a position that a `Body` writes in its own frame callback,
 * so the two are ordered or the camera eases toward where the body was last
 * frame. Both sat on R3F's default priority of 0, where subscribers run in
 * subscription order -- and `<Camera>` is rendered above the bodies in the
 * scene, so it subscribed first and always ran on stale positions.
 *
 * At real time a frame of orbital motion is nothing and the lag is invisible.
 * Wind the clock up and it is a real distance, so the body drifts off centre
 * by an amount proportional to how fast the simulation is running; pause, and
 * the displacement stops arriving and the easing closes it, which is the
 * "it snaps back when I pause" of the report. Mercury shows it first because
 * it covers the most ground per frame.
 *
 * The legacy had no equivalent problem because `OrbitViewer.update` is a
 * straight sequence: every `solarElements[i].update(d)` first, then
 * `controls.update()`.
 *
 * Fractional so it slots between the bodies and `COMPOSITOR_PRIORITY`. Any
 * priority above zero would normally hand rendering over to the subscriber,
 * but the compositor has already taken that on.
 */
export const CAMERA_PRIORITY = 0.5;

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

/**
 * Applies the frame's target and limits to the camera.
 *
 * drei's <OrbitControls> runs `if (controls.enabled) controls.update()` in its
 * own frame callback, so while the controls are disabled it never updates them
 * -- and disabling them is exactly what this component does to keep the
 * pointer out of a flight in progress. The result was a camera that could not
 * move at all for the duration:
 *
 *   - selecting a body opened the panel, held perfectly still while the
 *     distance limits eased down unseen, then snapped the whole way in on the
 *     single frame `enabled` flipped back to true;
 *
 *   - and with the clock wound up, the easing pivot never got within
 *     `ARRIVAL_THRESHOLD` of a fast-moving body at all, so `enabled` stayed
 *     false indefinitely and the camera simply stopped following. Pausing let
 *     the pivot close the gap, which flipped `enabled` and snapped the body
 *     back to centre -- the "it re-centres when I pause" of the report.
 *
 * The legacy has no equivalent because `CameraManager.update` sets
 * `controls.enabled` and then calls `this.controls.update()` regardless;
 * `enabled` gates input handling in three's OrbitControls, not the update.
 *
 * Only called here when drei will not, so the controls still update exactly
 * once a frame and damping is applied once. That split also lands the right
 * way round: this runs after the bodies have moved and after the pivot is
 * written, so the frames where the camera is actually chasing something use
 * this frame's positions, while drei's earlier pass covers the settled case
 * where a frame of staleness cannot be seen.
 */
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
  const { zoomRef, recenterRef } = useSceneControls();

  // Scratch, reused per frame.
  const offset = useMemo(() => new Vector3(), []);

  /**
   * Whether the current target has had its distance limits collapsed yet.
   *
   * Following works by easing `controls.maxDistance` down onto the body until
   * OrbitControls pulls the camera in against it. But the limit starts at
   * `CAMERA_LIMITS.max` -- three million units, wide enough for the whole
   * scene -- while the camera sits about eleven thousand out, and a limit
   * above the camera's own distance clamps nothing. So the first stretch of
   * the ease is inert: 3,000,000 to 11,180 at 3.6% a frame is 153 frames,
   * two and a half seconds in which the panel is open, the body is selected,
   * and the view is perfectly still. Then the real flight begins.
   *
   * That dead stretch is the "delay before we are zoomed in". Collapsing the
   * ceiling onto the camera's actual distance the moment a target is taken
   * removes it and changes nothing else: every value skipped was one that
   * could not have moved the camera anyway.
   */
  const framedTarget = useRef<CameraTarget | null>(null);

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
      // Newly acquired: drop the inert part of the ease. See framedTarget.
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

      // Following works by easing the orbit pivot onto the body and closing
      // the distance limits around it: OrbitControls then pulls the camera in
      // on its own, which is how the legacy produced its fly-to.
      //
      // The lag this leaves is the point, and it is load-bearing. A plain
      // lerp closes a fixed fraction of the gap each frame while the body
      // opens a fresh one, so the gap settles at about 27 frames of the
      // body's motion -- invisible at real time, and widening with the clock.
      // That is the elastic tether the legacy has: wind the speed up and the
      // planet pulls away from the camera, slow down or pause and the camera
      // glides back onto it. `CameraManager.update` gets it from this one
      // line and nothing else; there is no spring and no velocity term.
      //
      // It reads like a bug and it is not. Cancelling the lag by carrying the
      // body's per-frame displacement into the pivot -- which was tried --
      // does pin the planet dead centre, and ruins it: the pivot then jumps
      // by the body's whole displacement every frame, so the planet holds
      // still while the entire background jerks around it. Smooth camera,
      // drifting planet is the trade the legacy makes, and it is the right
      // one. Leave the lerp alone.
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

      driveControls(controls);
    } else {
      framedTarget.current = null;

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
      driveControls(controls);
    }
  }, CAMERA_PRIORITY);

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
