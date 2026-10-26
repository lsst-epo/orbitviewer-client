"use client";

import type { FunctionComponent } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useCapture } from "@/contexts/Capture";
import { COMPOSITOR_PRIORITY } from "@/components/scene/effects/composite";

/** Just above the compositor: the frame is drawn and its buffer still valid. */
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
