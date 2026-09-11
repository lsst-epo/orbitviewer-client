import { CatmullRomCurve3, Vector3 } from "three";
import {
  calculateOrbitByType,
  type PerturbationContext,
} from "@/lib/solar/orbits";
import { dateToMJD } from "@/lib/solar/time";
import { OrbitType, type OrbitElements } from "@/lib/solar/types";

/**
 * Traces one full revolution of an orbit as a polyline.
 *
 * Ported from `gfx/solar/EllipticalPath.ts`. The algorithm walks the orbit
 * forward in time from today, emitting a point whenever the body has moved
 * more than a threshold distance, and stops once it comes back within that
 * distance of the start. The step adapts to eccentricity: highly eccentric
 * orbits move very fast near perihelion, so they need finer sampling to avoid
 * cutting the corner.
 */

/** Sample spacing as a fraction of semi-major axis, by eccentricity. */
const SAMPLE_SPACING = { low: 0.1, high: 5 };
/** Days advanced per probe, by eccentricity. */
const TIME_STEP = { low: 0.05, high: 1 };
const MIN_POINTS = 10;
/** Guard against a non-closing walk pinning the main thread. */
const MAX_POINTS = 5000;

const smoothstep = (min: number, max: number, value: number): number => {
  const t = Math.min(Math.max((value - min) / (max - min), 0), 1);
  return t * t * (3 - 2 * t);
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export interface OrbitPathResult {
  points: Array<Vector3>;
  /** Heliocentric distance of the first sample, in scene units. */
  startDistance: number;
}

export function buildOrbitPath(
  el: OrbitElements,
  { from = new Date(), perturbations = {} as PerturbationContext } = {}
): OrbitPathResult | null {
  // Only closed orbits trace a repeating path. Parabolic and hyperbolic
  // bodies pass through once and need an open arc instead -- see the note in
  // the component.
  if (el.type !== OrbitType.Elliptical) return null;

  const points: Vector3[] = [];
  let d = dateToMJD(from);

  const first = new Vector3();
  calculateOrbitByType(el, d, OrbitType.Elliptical, first, perturbations);
  points.push(first);

  // e above ~0.9 needs the tighter sampling and finer time step.
  const eccentric = smoothstep(0.9, 0.95, el.e);
  const spacing = lerp(SAMPLE_SPACING.low, SAMPLE_SPACING.high, 1 - eccentric);
  const step = lerp(TIME_STEP.low, TIME_STEP.high, 1 - eccentric);
  const minDistance = spacing * el.a;

  const cursor = new Vector3();
  calculateOrbitByType(el, ++d, OrbitType.Elliptical, cursor, perturbations);

  while (
    (points.length < MIN_POINTS ||
      cursor.distanceTo(points[0]) > minDistance) &&
    points.length < MAX_POINTS
  ) {
    while (
      cursor.distanceTo(points[points.length - 1]) < minDistance &&
      points.length < MAX_POINTS
    ) {
      d += step;
      calculateOrbitByType(el, d, OrbitType.Elliptical, cursor, perturbations);
    }

    points.push(cursor.clone());
  }

  if (points.length < 3) return null;

  // Resample through a closed spline so the rendered line is smooth rather
  // than faceted, with more segments for wider orbits.
  const curve = new CatmullRomCurve3(points, true);
  const startDistance = points[0].length();
  const spread = smoothstep(330, 1500, startDistance);
  const segments = Math.round(lerp(200, 500, spread)) * 2;

  return { points: curve.getPoints(segments), startDistance };
}
