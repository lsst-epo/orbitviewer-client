import { CatmullRomCurve3, Vector3 } from "three";
import {
  calculateOrbitByType,
  getCartesianCoordinates,
  type PerturbationContext,
} from "@/lib/solar/orbits";
import { PLANET_SCALE } from "@/lib/solar/constants";
import { dateToMJD } from "@/lib/solar/time";
import { OrbitType, type OrbitElements } from "@/lib/solar/types";

/**
 * Walks the orbit forward from today, emitting a point whenever the body has
 * moved past a threshold, until it returns near the start. Ported from
 * `gfx/solar/EllipticalPath.ts`; the step adapts to eccentricity.
 */

/** Sample spacing as a fraction of semi-major axis, by eccentricity. */
const SAMPLE_SPACING = { low: 0.1, high: 5 };
/** Days advanced per probe, by eccentricity. */
const TIME_STEP = { low: 0.05, high: 1 };
const MIN_POINTS = 10;
/** Guard against a non-closing walk pinning the main thread. */
const MAX_POINTS = 5000;

/** Ceiling on probes per revolution, so long-period orbits stay cheap. */
const MAX_PROBES = 100_000;

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

/** How far out an open arc is drawn. Matches the distance filter's ceiling. */
const OPEN_ARC_MAX_AU = 500;

/** Samples per branch of an open arc. Both branches share the apex. */
const OPEN_ARC_SEGMENTS = 160;

/**
 * Traces the visible part of an unbound orbit, sampled in true anomaly rather
 * than stepped through time, with samples spaced geometrically in r. The
 * legacy drew nothing here at all; see README.
 */
function buildOpenArc(el: OrbitElements): OrbitPathResult | null {
  const { q, e } = el;

  // Below perihelion there is nothing to draw, and a bound orbit does not
  // belong here.
  if (!(q > 0) || !(e >= 1) || q >= OPEN_ARC_MAX_AU) return null;

  const semiLatus = q * (1 + e);

  /** True anomaly at radius r, on the outbound branch. */
  const anomalyAt = (r: number): number => {
    const cos = Math.min(Math.max((semiLatus / r - 1) / e, -1), 1);
    return Math.acos(cos);
  };

  const ratio = OPEN_ARC_MAX_AU / q;

  /** Radii from perihelion outwards, spaced geometrically. */
  const radii = Array.from(
    { length: OPEN_ARC_SEGMENTS + 1 },
    (_, step) => q * ratio ** (step / OPEN_ARC_SEGMENTS)
  );

  // Inbound then outbound, sharing the apex: the two branches are mirror
  // images about perihelion, so the same radii serve both with the sign of
  // the true anomaly flipped.
  const points = [
    ...radii
      .slice(1)
      .reverse()
      .map((r) => getCartesianCoordinates(-anomalyAt(r), r, el)),
    ...radii.map((r) => getCartesianCoordinates(anomalyAt(r), r, el)),
  ];

  return { points, startDistance: points[0].length() };
}

export function buildOrbitPath(
  el: OrbitElements,
  { from = new Date(), perturbations = {} as PerturbationContext } = {}
): OrbitPathResult | null {
  // Unbound orbits pass through once; they get an open arc rather than a
  // traced revolution.
  if (el.type !== OrbitType.Elliptical) return buildOpenArc(el);

  const points: Vector3[] = [];
  let d = dateToMJD(from);

  const first = new Vector3();
  calculateOrbitByType(el, d, OrbitType.Elliptical, first, perturbations);
  points.push(first);

  // e above ~0.9 needs the tighter sampling and finer time step.
  const eccentric = smoothstep(0.9, 0.95, el.e);
  const spacing = lerp(SAMPLE_SPACING.low, SAMPLE_SPACING.high, 1 - eccentric);
  const minDistance = spacing * el.a;

  // Mean motion is in degrees per day, so a revolution is 360/n of them.
  const period = el.n > 0 ? 360 / el.n : 0;
  const step = Math.max(
    lerp(TIME_STEP.low, TIME_STEP.high, 1 - eccentric),
    period / MAX_PROBES
  );

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

/**
 * Where to put the camera to see the whole orbit rather than the body.
 * Derived from the elements, not the traced polyline, so the camera need not
 * wait for the path and the two cannot disagree.
 */

/** Fraction of the orbit's own size used as the framing radius. */
const ORBIT_FRAMING = 0.45;

/**
 * How much of an unbound orbit to frame, in perihelion distances. Its arc
 * runs to 500 AU, but the part worth looking at is the turn around the Sun.
 */
const OPEN_FRAMING_Q = 12;

export interface OrbitFraming {
  /** Pivot in scene units. */
  position: Vector3;
  /** Framing radius in scene units. */
  radius: number;
}

export function orbitFraming(el: OrbitElements): OrbitFraming {
  if (el.type === OrbitType.Elliptical && el.a > 0) {
    // The geometric centre of the ellipse sits a*e from the focus, along the
    // apsidal line towards aphelion -- which is true anomaly 180 degrees.
    return {
      position: getCartesianCoordinates(Math.PI, el.a * el.e, el),
      radius: el.a * PLANET_SCALE * ORBIT_FRAMING,
    };
  }

  // An unbound orbit has no centre; the Sun is the only fixed point on it.
  return {
    position: new Vector3(0, 0, 0),
    radius: Math.max(el.q, 0.1) * OPEN_FRAMING_Q * PLANET_SCALE * ORBIT_FRAMING,
  };
}
