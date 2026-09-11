"use client";

import { useEffect, useState, type FunctionComponent } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { GFX_TIERS, type SimQuality } from "@/lib/solar/quality";
import { Compositor } from "./compositor";

/**
 * Drives the glow/bloom compositor.
 *
 * Renders nothing itself; it takes over the render loop. R3F stops rendering
 * automatically as soon as any useFrame subscriber has a priority above zero,
 * at which point drawing the scene becomes this component's job.
 *
 * Frame ordering is by ascending priority, so the pipeline runs:
 *   -2  advance the simulation clock
 *   -1  propagate orbits into the GPU simulation texture
 *    1  render + glow + blur + composite  (here)
 */
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
  const [compositor, setCompositor] = useState<Compositor | null>(null);

  // Created inside the effect that disposes it. A useMemo would survive a
  // StrictMode remount while its cleanup had already freed the GPU resources,
  // leaving a dead instance behind.
  useEffect(() => {
    if (!enabled) return;

    let instance: Compositor;

    try {
      instance = new Compositor(gl, GFX_TIERS[quality]);
    } catch (cause) {
      // Leaving `compositor` null makes the frame callback fall through to
      // ordinary rendering, so a compositor failure costs the glow, not the
      // whole scene.
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
    // Render targets are sized in device pixels, not CSS pixels.
    const { width, height } = gl.domElement;
    compositor.setSize(width, height);
  }, [compositor, gl, size.width, size.height]);

  /**
   * Taking a priority above zero switches R3F's automatic rendering off for
   * the whole canvas -- including when this component has no compositor to
   * render with. The fallback is therefore not optional: without it, a
   * compositor that fails to build leaves a blank canvas rather than an
   * un-bloomed scene.
   */
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
