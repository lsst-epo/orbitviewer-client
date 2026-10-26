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

/** Default opacity, matching the legacy DEFAULT_PATH_ALPHA. */
export const PATH_ALPHA = 0.05;

/** Device pixels, not CSS pixels -- see README before changing. */
const PATH_WIDTH = 1;
const SELECTED_PATH_WIDTH = 2;

/** Selected path opacity, by framing. The legacy drew the same distinction. */
export const SELECTED_PATH_ALPHA = { object: 0.25, orbit: 1 };

const FALLBACK_COLOR = "#8d8d8d";

export interface OrbitalPathProps {
  elements: OrbitElements;
  /** Category colour from Craft's objectTypes group. */
  color?: string | null;
  selected?: boolean;
  /** Which framing the camera is using, when this path is the selected one. */
  view?: "object" | "orbit";
  /** Scene radius of the body. Sets the near-camera fade band; see ./fade. */
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

  useLayoutEffect(() => {
    const material = lineRef.current?.material as LineMaterial | undefined;
    if (!material || fadeRef.current) return;

    // Patched once, then driven by uniform: recompiling a shader to move a
    // fade band would stall the frame it happened on.
    fadeRef.current = applyPathFade(material);
  });

  useLayoutEffect(() => {
    if (!fadeRef.current) return;

    // Zero disables it: `smoothstep(0, 0, d)` is 1 for every d above zero.
    const band = fadeRadius ? fadeBandFor(fadeRadius) : { near: 0, far: 0 };

    fadeRef.current.fadeNear.value = band.near;
    fadeRef.current.fadeFar.value = band.far;
  }, [fadeRadius]);

  if (!path) return null;

  return (
    <Line
      ref={lineRef}
      points={path.points}
      color={lineColor}
      lineWidth={selected ? SELECTED_PATH_WIDTH : PATH_WIDTH}
      transparent
      opacity={selected ? SELECTED_PATH_ALPHA[view] : PATH_ALPHA}
      // Paths cross constantly at this density; writing depth would make the
      // overlaps flicker as the camera moves.
      depthWrite={false}
    />
  );
};

export default OrbitalPath;
