import { CatmullRomCurve3, Vector3 } from "three";
import {
  calculateOrbitByType,
  getCartesianCoordinates,
  type PerturbationContext,
} from "@/lib/solar/orbits";
import { DEG_TO_RAD, EPOCH, PLANET_SCALE } from "@/lib/solar/constants";
import { dateToMJD } from "@/lib/solar/time";
import { OrbitType, type OrbitElements } from "@/lib/solar/types";

/** Points sampled around an ellipse, from a circle to the most eccentric. */
const SAMPLE_COUNT = { min: 250, max: 1500 };

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
 * than stepped through time. The legacy drew nothing here at all; see README.
 */
function buildOpenArc(el: OrbitElements): OrbitPathResult | null {
  const { q, e } = el;

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
  if (el.type !== OrbitType.Elliptical) return buildOpenArc(el);

  if (!(el.n > 0)) return null;

  // Spaced evenly in eccentric anomaly, so the cost is a fixed number of
  // solves however long or thin the orbit is. See README.
  const eccentricity = Math.min(Math.max(el.e, 0), 1);
  const count = Math.round(
    lerp(SAMPLE_COUNT.min, SAMPLE_COUNT.max, eccentricity)
  );

  const today = dateToMJD(from);
  const meanToday = el.M + el.n * (today - (el.epoch ?? EPOCH));

  const points: Vector3[] = [];

  for (let index = 0; index < count; index++) {
    const E = (index / count) * Math.PI * 2;
    const meanDegrees = (E - el.e * Math.sin(E)) / DEG_TO_RAD;

    // The date this point is reached within the revolution starting today,
    // which is what the perturbations of the giants are evaluated at.
    const ahead = (((meanDegrees - meanToday) % 360) + 360) % 360;

    points.push(
      calculateOrbitByType(
        el,
        today + ahead / el.n,
        OrbitType.Elliptical,
        new Vector3(),
        perturbations
      )
    );
  }

  const curve = new CatmullRomCurve3(points, true);
  const startDistance = points[0].length();
  const spread = smoothstep(330, 1500, startDistance);
  const segments = Math.round(lerp(200, 500, spread)) * 2;

  return { points: curve.getPoints(segments), startDistance };
}

/** Fraction of the orbit's own size used as the framing radius. */
const ORBIT_FRAMING = 0.45;

/** How much of an unbound orbit to frame, in perihelion distances. */
const OPEN_FRAMING_Q = 12;

export interface OrbitFraming {
  /** Pivot in scene units. */
  position: Vector3;
  /** Framing radius in scene units. */
  radius: number;
}

export function orbitFraming(el: OrbitElements): OrbitFraming {
  if (el.type === OrbitType.Elliptical && el.a > 0) {
    return {
      position: getCartesianCoordinates(Math.PI, el.a * el.e, el),
      radius: el.a * PLANET_SCALE * ORBIT_FRAMING,
    };
  }

  return {
    position: new Vector3(0, 0, 0),
    radius: Math.max(el.q, 0.1) * OPEN_FRAMING_Q * PLANET_SCALE * ORBIT_FRAMING,
  };
}
