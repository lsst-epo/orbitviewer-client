"use client";

import { useEffect, useState, type FunctionComponent } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { GFX_TIERS, type SimQuality } from "@/lib/solar/quality";
import { Compositor } from "./compositor";

export const COMPOSITOR_PRIORITY = 1;

export interface CompositorEffectProps {
  quality: SimQuality;
  /** Falls back to R3F's own rendering when false. */
  enabled?: boolean;
}

const CompositorEffect: FunctionComponent<CompositorEffectProps> = ({
  quality,
  enabled = true,
}) => {
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const dpr = useThree((state) => state.viewport.dpr);
  // Created inside the effect that disposes it. A useMemo would survive a
  // StrictMode remount while its cleanup had already freed the GPU resources.
  const [compositor, setCompositor] = useState<Compositor | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let instance: Compositor;

    try {
      instance = new Compositor(gl, GFX_TIERS[quality]);
    } catch (cause) {
      console.error("Failed to create the glow compositor", cause);
      return;
    }

    setCompositor(instance);

    return () => {
      instance.dispose();
      setCompositor((current) => (current === instance ? null : current));
    };
  }, [gl, enabled, quality]);

  useEffect(() => {
    if (!compositor) return;
    const { width, height } = gl.domElement;
    compositor.setSize(width, height);
    // Render targets are sized in device pixels, so this has to run on a
    // pixel-ratio change as well as a resize: `size` is in CSS pixels.
  }, [compositor, gl, size.width, size.height, dpr]);

  useFrame((state) => {
    if (compositor) {
      compositor.render(state.scene, state.camera);
    } else {
      state.gl.render(state.scene, state.camera);
    }
  }, COMPOSITOR_PRIORITY);

  return null;
};

export default CompositorEffect;
