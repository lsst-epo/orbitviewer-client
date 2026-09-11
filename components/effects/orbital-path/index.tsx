"use client";

import { useMemo, type FunctionComponent } from "react";
import { Line } from "@react-three/drei";
import { Color } from "three";
import type { OrbitElements } from "@/lib/solar/types";
import type { PerturbationContext } from "@/lib/solar/orbits";
import { buildOrbitPath } from "./buildPath";

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
/** Opacity for the selected body's path. */
export const SELECTED_PATH_ALPHA = 1;

const FALLBACK_COLOR = "#8d8d8d";

export interface OrbitalPathProps {
  elements: OrbitElements;
  /** Category colour from Craft's objectTypes group. */
  color?: string | null;
  selected?: boolean;
  perturbations?: PerturbationContext;
}

const OrbitalPath: FunctionComponent<OrbitalPathProps> = ({
  elements,
  color,
  selected = false,
  perturbations,
}) => {
  const path = useMemo(
    () => buildOrbitPath(elements, { perturbations }),
    [elements, perturbations]
  );

  const lineColor = useMemo(() => new Color(color || FALLBACK_COLOR), [color]);

  // Non-elliptical orbits do not close, so buildOrbitPath declines them.
  // Open arcs for parabolic/hyperbolic bodies are still to do.
  if (!path) return null;

  return (
    <Line
      points={path.points}
      color={lineColor}
      lineWidth={selected ? 2 : 1}
      transparent
      opacity={selected ? SELECTED_PATH_ALPHA : PATH_ALPHA}
      // Paths cross constantly at this density; writing depth would make the
      // overlaps flicker as the camera moves.
      depthWrite={false}
    />
  );
};

export default OrbitalPath;
