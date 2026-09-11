"use client";

import type { FunctionComponent } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useCapture } from "@/contexts/Capture";
import { COMPOSITOR_PRIORITY } from "@/components/effects/composite";

/**
 * Fulfils capture requests from inside the render loop.
 *
 * Runs at a priority just above the compositor, so the frame has been drawn
 * and the drawing buffer is still valid -- which is the whole reason this
 * lives inside the Canvas rather than in the share dialog.
 *
 * The snapshot is copied into a plain 2D canvas because the WebGL buffer is
 * cleared before the next paint; a reference to `gl.domElement` would be
 * blank by the time the dialog rendered it.
 */
export const CAPTURE_PRIORITY = COMPOSITOR_PRIORITY + 1;

const SceneCapture: FunctionComponent = () => {
  const gl = useThree((state) => state.gl);
  const { pending } = useCapture();

  useFrame(() => {
    const request = pending.current;
    if (!request) return;

    pending.current = null;

    const source = gl.domElement;
    const snapshot = document.createElement("canvas");
    snapshot.width = source.width;
    snapshot.height = source.height;

    const context = snapshot.getContext("2d");

    if (!context) {
      request.resolve(null);
      return;
    }

    context.drawImage(source, 0, 0);
    request.resolve(snapshot);
  }, CAPTURE_PRIORITY);

  return null;
};

export default SceneCapture;
