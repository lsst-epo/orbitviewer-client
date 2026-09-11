"use client";

import { useEffect, useRef, type FunctionComponent } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Vector3 } from "three";

/**
 * Scene camera and its controls.
 *
 * Ported from the legacy `gfx/core/CameraManager.ts`, which hand-rolled
 * pointer, wheel and pinch handling on top of three's OrbitControls. drei's
 * <OrbitControls> already covers all of that, so this component keeps only
 * what was genuinely bespoke: the distance limits, the damping feel, and
 * the ability to frame a target body.
 */

/** Distance limits in scene units (1000 units = 1 AU). */
export const CAMERA_LIMITS = {
  min: 24,
  max: 3_000_000,
};

/**
 * Near/far planes. The scene spans roughly 24 to 3,000,000 units, which is far
 * too wide for a 32-bit depth buffer -- hence the logarithmic depth buffer on
 * the Canvas, which is what makes this range usable at all.
 */
export const CAMERA_CLIP = {
  near: 0.01,
  far: CAMERA_LIMITS.max + 5_000_000,
};

export const DEFAULT_CAMERA_POSITION = new Vector3(0, 5000, 10000);

export interface CameraProps {
  /** World-space point to orbit around. Defaults to the sun at the origin. */
  target?: Vector3;
  enabled?: boolean;
}

const Camera: FunctionComponent<CameraProps> = ({ target, enabled = true }) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const camera = useThree((state) => state.camera);

  // Set the initial vantage point once, rather than through <Canvas camera>,
  // so that remounting the controls does not snap the user's view back.
  useEffect(() => {
    camera.position.copy(DEFAULT_CAMERA_POSITION);
    camera.updateProjectionMatrix();
  }, [camera]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || !target) return;

    controls.target.copy(target);
    controls.update();
  }, [target]);

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={enabled}
      makeDefault
      // Damping gives the drift the legacy CameraManager applied by lerping
      // toward its target every frame.
      enableDamping
      dampingFactor={0.06}
      // Panning away from the sun loses the frame of reference, and the
      // legacy controls did not offer it either.
      enablePan={false}
      minDistance={CAMERA_LIMITS.min}
      maxDistance={CAMERA_LIMITS.max}
      // Zoom is proportional to distance, otherwise crossing six orders of
      // magnitude takes either forever or one wheel click.
      zoomSpeed={0.8}
      rotateSpeed={0.5}
    />
  );
};

export default Camera;
