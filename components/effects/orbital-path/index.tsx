"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  type FunctionComponent,
} from "react";
import { Line } from "@react-three/drei";
import { Color } from "three";
import type { Line2, LineMaterial } from "three-stdlib";
import type { OrbitElements } from "@/lib/solar/types";
import type { PerturbationContext } from "@/lib/solar/orbits";
import { buildOrbitPath } from "./buildPath";
import { applyPathFade, fadeBandFor, type PathFadeUniforms } from "./fade";

/**
 * The traced orbit of a single body.
 *
 * Ported from `gfx/solar/EllipticalPath.ts`. drei's <Line> wraps the same
 * Line2/LineMaterial pair the legacy code used directly, which is what allows
 * a real line width -- native WebGL line width is capped at 1px on most
 * drivers.
 *
 * The geometry is expensive to trace and does not change as the clock runs
 * (the body moves along a fixed ellipse), so it is memoised on the elements
 * and rebuilt only when they change.
 */

/** Default opacity, matching the legacy DEFAULT_PATH_ALPHA. */
export const PATH_ALPHA = 0.05;

/**
 * Opacity for the selected body's path, by how the camera is framing it.
 *
 * The legacy made the same distinction -- `followSolarElement` called
 * `sel.focus()` in orbit mode and `sel.blur(OBJECT_PATH_ALPHA)` otherwise.
 * Close in on a body and its orbit is context, not the subject; at full
 * strength it dominates a view it is not the point of.
 */
export const SELECTED_PATH_ALPHA = { object: 0.25, orbit: 1 };

const FALLBACK_COLOR = "#8d8d8d";

export interface OrbitalPathProps {
  elements: OrbitElements;
  /** Category colour from Craft's objectTypes group. */
  color?: string | null;
  selected?: boolean;
  /** Which framing the camera is using, when this path is the selected one. */
  view?: "object" | "orbit";
  /**
   * Scene radius of the body this path belongs to. Sets how close to the
   * camera the line fades out; see ./fade.
   */
  fadeRadius?: number;
  perturbations?: PerturbationContext;
}

const OrbitalPath: FunctionComponent<OrbitalPathProps> = ({
  elements,
  color,
  selected = false,
  view = "object",
  fadeRadius,
  perturbations,
}) => {
  const path = useMemo(
    () => buildOrbitPath(elements, { perturbations }),
    [elements, perturbations]
  );

  const lineColor = useMemo(() => new Color(color || FALLBACK_COLOR), [color]);

  const lineRef = useRef<Line2>(null);
  const fadeRef = useRef<PathFadeUniforms | null>(null);

  // Patched once, then driven by uniform: recompiling a shader to move a
  // fade band would stall the frame it happened on.
  useLayoutEffect(() => {
    const material = lineRef.current?.material as LineMaterial | undefined;
    if (!material || fadeRef.current) return;

    fadeRef.current = applyPathFade(material);
  });

  useLayoutEffect(() => {
    if (!fadeRef.current) return;

    // Zero disables it: `smoothstep(0, 0, d)` is 1 for every d above zero.
    const band = fadeRadius ? fadeBandFor(fadeRadius) : { near: 0, far: 0 };

    fadeRef.current.fadeNear.value = band.near;
    fadeRef.current.fadeFar.value = band.far;
  }, [fadeRadius]);

  // Null only when there is genuinely nothing to draw -- an orbit whose
  // perihelion is already beyond the scene, or elements too degenerate to
  // trace. Unbound orbits get an open arc; see buildOrbitPath.
  if (!path) return null;

  return (
    <Line
      ref={lineRef}
      points={path.points}
      color={lineColor}
      lineWidth={selected ? 2 : 1}
      transparent
      opacity={selected ? SELECTED_PATH_ALPHA[view] : PATH_ALPHA}
      // Paths cross constantly at this density; writing depth would make the
      // overlaps flicker as the camera moves.
      depthWrite={false}
    />
  );
};

export default OrbitalPath;
