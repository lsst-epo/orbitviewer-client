import { Vector3 } from "three";
import {
  DEG_TO_RAD,
  E_CONVERGENCE_THRESHOLD,
  E_CONVERGE_MAX_ITERATIONS,
  EPOCH,
  K,
  PLANET_SCALE,
} from "./constants";
import { OrbitElements, OrbitType } from "./types";

/**
 * Orbit propagators: elements plus a Modified Julian Date to a heliocentric
 * position in scene units. Each writes into a caller-supplied Vector3 so the
 * per-frame loop does not allocate -- see README.
 */

/** Mean anomalies of the perturbing giants, cached per propagation pass. */
export interface PerturbationContext {
  jupiter?: OrbitElements;
  saturn?: OrbitElements;
  uranus?: OrbitElements;
}

/**
 * Orbital plane to scene-space cartesian. `convert` maps ecliptic z-up to
 * three's y-up, negating y as well as swapping it -- see README.
 */
export function getCartesianCoordinates(
  v: number,
  r: number,
  el: OrbitElements,
  target: Vector3 = new Vector3(),
  convert = true
): Vector3 {
  const N = el.N * DEG_TO_RAD;
  const w = el.w * DEG_TO_RAD;
  const i = el.i * DEG_TO_RAD;

  const cosN = Math.cos(N);
  const sinN = Math.sin(N);
  const cosVW = Math.cos(v + w);
  const sinVW = Math.sin(v + w);
  const cosI = Math.cos(i);

  const xh = r * (cosN * cosVW - sinN * sinVW * cosI);
  const yh = r * (sinN * cosVW + cosN * sinVW * cosI);
  const zh = r * (sinVW * Math.sin(i));

  if (convert) {
    target.set(xh * PLANET_SCALE, zh * PLANET_SCALE, -yh * PLANET_SCALE);
  } else {
    target.set(xh * PLANET_SCALE, yh * PLANET_SCALE, zh * PLANET_SCALE);
  }

  return target;
}

/** Mean anomaly in radians at date `d`, for a perturbing planet. */
const planetMeanAnomaly = (el: OrbitElements | undefined, d: number): number =>
  el ? (el.M + el.n * (d - (el.epoch || 0))) * DEG_TO_RAD : 0;

/**
 * Schlyter's long-period perturbation terms for the outer giants. Diverges
 * from the legacy, which had two faults here that cancelled out -- see README
 * before touching the gating or the units.
 */
function applyGiantPerturbations(
  el: OrbitElements,
  d: number,
  r: number,
  target: Vector3,
  ctx: PerturbationContext
): Vector3 {
  const Mj = planetMeanAnomaly(ctx.jupiter, d);
  const Ms = planetMeanAnomaly(ctx.saturn, d);
  const Mu = planetMeanAnomaly(ctx.uranus, d);

  let lonecl = Math.atan2(target.y, target.x);
  let latecl = Math.atan2(
    target.z,
    Math.sqrt(target.x * target.x + target.y * target.y)
  );

  if (el.id === "jupiter") {
    lonecl +=
      -0.332 * DEG_TO_RAD * Math.sin(2 * Mj - 5 * Ms - 67.6 * DEG_TO_RAD);
    lonecl += -0.056 * DEG_TO_RAD * Math.sin(2 * Mj - 2 * Ms + 21 * DEG_TO_RAD);
    lonecl += +0.042 * DEG_TO_RAD * Math.sin(3 * Mj - 5 * Ms + 21 * DEG_TO_RAD);
    lonecl += -0.036 * DEG_TO_RAD * Math.sin(Mj - 2 * Ms);
    lonecl += +0.022 * DEG_TO_RAD * Math.cos(Mj - Ms);
    lonecl += +0.023 * DEG_TO_RAD * Math.sin(2 * Mj - 3 * Ms + 52 * DEG_TO_RAD);
    lonecl += -0.016 * DEG_TO_RAD * Math.sin(Mj - 5 * Ms - 69 * DEG_TO_RAD);
  }

  if (el.id === "saturn") {
    lonecl +=
      +0.812 * DEG_TO_RAD * Math.sin(2 * Mj - 5 * Ms - 67.6 * DEG_TO_RAD);
    lonecl += -0.229 * DEG_TO_RAD * Math.cos(2 * Mj - 4 * Ms - 2 * DEG_TO_RAD);
    lonecl += +0.119 * DEG_TO_RAD * Math.sin(Mj - 2 * Ms - 3 * DEG_TO_RAD);
    lonecl += +0.046 * DEG_TO_RAD * Math.sin(2 * Mj - 6 * Ms - 69 * DEG_TO_RAD);
    lonecl += +0.014 * DEG_TO_RAD * Math.sin(Mj - 3 * Ms + 32 * DEG_TO_RAD);

    latecl += -0.02 * DEG_TO_RAD * Math.cos(2 * Mj - 4 * Ms - 2 * DEG_TO_RAD);
    latecl += +0.018 * DEG_TO_RAD * Math.sin(2 * Mj - 6 * Ms - 49 * DEG_TO_RAD);
  }

  if (el.id === "uranus") {
    lonecl += +0.04 * DEG_TO_RAD * Math.sin(Ms - 2 * Mu + 6 * DEG_TO_RAD);
    lonecl += +0.035 * DEG_TO_RAD * Math.sin(Ms - 3 * Mu + 33 * DEG_TO_RAD);
    lonecl += -0.015 * DEG_TO_RAD * Math.sin(Mj - Mu + 20 * DEG_TO_RAD);
  }

  const cosLat = Math.cos(latecl);
  const xh = PLANET_SCALE * r * Math.cos(lonecl) * cosLat;
  const yh = PLANET_SCALE * r * Math.sin(lonecl) * cosLat;
  const zh = PLANET_SCALE * r * Math.sin(latecl);

  target.set(xh, zh, -yh);

  return target;
}

const PERTURBED = new Set(["jupiter", "saturn", "uranus"]);

/** Elliptical orbits: solve Kepler's equation by Newton-Raphson. */
export function keplerCalc(
  el: OrbitElements,
  d: number,
  target: Vector3 = new Vector3(),
  ctx: PerturbationContext = {}
): Vector3 {
  const e = el.e;
  const epoch = el.epoch ?? EPOCH;
  const M = (el.M + el.n * (d - epoch)) * DEG_TO_RAD;

  // First-order starting estimate; exact enough on its own for near-circular
  // orbits, which is why the refinement below is skipped under e = 0.05.
  let E = M + e * Math.sin(M) * (1.0 + e * Math.cos(M));

  if (e >= 0.05) {
    let E0 = E;
    let E1 = E0 - (E0 - e * Math.sin(E0) - M) / (1 - e * Math.cos(E0));
    let iterations = 0;

    while (
      Math.abs(E1 - E0) > E_CONVERGENCE_THRESHOLD &&
      iterations < E_CONVERGE_MAX_ITERATIONS
    ) {
      iterations++;
      E0 = E1;
      E1 = E0 - (E0 - e * Math.sin(E0) - M) / (1 - e * Math.cos(E0));
    }

    E = E1;
  }

  const a = el.a;
  const xv = a * (Math.cos(E) - e);
  const yv = a * (Math.sqrt(1.0 - e * e) * Math.sin(E));

  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);

  if (PERTURBED.has(el.id)) {
    // Perturbation maths works in the unconverted z-up frame.
    getCartesianCoordinates(v, r, el, target, false);
    return applyGiantPerturbations(el, d, r, target, ctx);
  }

  return getCartesianCoordinates(v, r, el, target);
}

/** Parabolic orbits (e = 1), via Barker's equation. */
export function parabolicCalc(
  el: OrbitElements,
  d: number,
  target: Vector3 = new Vector3()
): Vector3 {
  const dT = el.Tp ?? 0;
  const q = el.q;

  const H = ((d - dT) * (K / Math.sqrt(2))) / Math.sqrt(q * q * q);

  const h = 1.5 * H;
  const g = Math.sqrt(1.0 + h * h);
  const s = Math.cbrt(g + h) - Math.cbrt(g - h);

  const v = 2.0 * Math.atan(s);
  const r = q * (1.0 + s * s);

  return getCartesianCoordinates(v, r, el, target);
}

/** Near-parabolic orbits, via Schlyter's series expansion. */
export function nearParabolicCalc(
  el: OrbitElements,
  d: number,
  target: Vector3 = new Vector3()
): Vector3 {
  const q = el.q;
  const dT = el.Tp ?? 0;
  const e = el.e;

  const a = 0.75 * (d - dT) * K * Math.sqrt((1 + e) / (q * q * q));
  const b = Math.sqrt(1 + a * a);
  const W = Math.cbrt(b + a) - Math.cbrt(b - a);
  const f = (1 - e) / (1 + e);

  const a1 = 2 / 3 + (2 / 5) * W * W;
  const a2 = 7 / 5 + (33 / 35) * W * W + (37 / 175) * W ** 4;
  const a3 = W * W * (432 / 175 + (956 / 1125) * W * W + (84 / 1575) * W ** 4);

  const C = (W * W) / (1 + W * W);
  const g = f * C * C;
  const w = W * (1 + f * C * (a1 + a2 * g + a3 * g * g));

  const v = 2 * Math.atan(w);
  const r = (q * (1 + w * w)) / (1 + w * w * f);

  return getCartesianCoordinates(v, r, el, target);
}

/** Hyperbolic orbits (e > 1): solve the hyperbolic Kepler equation. */
export function hyperbolicCalc(
  el: OrbitElements,
  d: number,
  target: Vector3 = new Vector3()
): Vector3 {
  const e = el.e;
  const a = el.a;
  const dT = el.Tp ?? 0;

  // NOTE: the legacy code used DEG_TO_RAD (0.017453) here where the Gaussian
  // constant K (0.017202) is expected. The two differ by 1.4%, so this was
  // most likely a copy/paste slip between two near-identical constants --
  // but it changes propagation rates for hyperbolic bodies, so it is left as
  // written rather than silently altered. Flagged for the team to confirm.
  const M = (DEG_TO_RAD * (d - dT)) / (-a) ** 1.5;

  let F0 = M;
  let F1 =
    (M + e * (F0 * Math.cosh(F0) - Math.sinh(F0))) / (e * Math.cosh(F0) - 1);
  let iterations = 1;

  while (
    Math.abs(F1 - F0) > E_CONVERGENCE_THRESHOLD &&
    iterations < E_CONVERGE_MAX_ITERATIONS
  ) {
    iterations++;
    F0 = F1;
    F1 =
      (M + e * (F0 * Math.cosh(F0) - Math.sinh(F0))) / (e * Math.cosh(F0) - 1);
  }

  const F = F1;

  // KNOWN LEGACY BUG, FIXED HERE: the original closed atan() before
  // multiplying by tanh(F/2) --
  //   2 * atan( sqrt((e+1)/(e-1)) ) * tanh(F/2)
  // The true anomaly relation is tan(v/2) = sqrt((e+1)/(e-1)) * tanh(F/2), so
  // the product belongs inside atan. As written, the legacy version returned a
  // wrong true anomaly for every hyperbolic body.
  const v = 2 * Math.atan(Math.sqrt((e + 1) / (e - 1)) * Math.tanh(F / 2));
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(v));

  return getCartesianCoordinates(v, r, el, target);
}

export function calculateOrbitByType(
  el: OrbitElements,
  d: number,
  type: OrbitType = OrbitType.Elliptical,
  target: Vector3 = new Vector3(),
  ctx: PerturbationContext = {}
): Vector3 {
  switch (type) {
    case OrbitType.Elliptical:
      return keplerCalc(el, d, target, ctx);
    case OrbitType.Parabolic:
      return parabolicCalc(el, d, target);
    case OrbitType.NearParabolic:
      return nearParabolicCalc(el, d, target);
    default:
      return hyperbolicCalc(el, d, target);
  }
}

export function calculateOrbit(
  el: OrbitElements,
  d: number,
  target: Vector3 = new Vector3(),
  ctx: PerturbationContext = {}
): Vector3 {
  return calculateOrbitByType(el, d, el.type, target, ctx);
}

/** Mean anomaly in degrees at date `d`. */
export function getMeanAnomaly(el: OrbitElements, d: number): number {
  if (el.type === OrbitType.Hyperbolic) {
    return (d - (el.Tp ?? 0)) / (-el.a) ** 1.5;
  }

  return el.M + el.n * (d - (el.epoch ?? EPOCH));
}
