import { Vector3 } from "three";
import type { OrbitRecord } from "@/lib/api/hasura";

export const DEG = Math.PI / 180;
export const GAUSSIAN_K = 0.01720209895;
export const dateToMjd = (date: Date) => date.getTime() / 86400000 + 40587;
export const mjdToDate = (mjd: number) => new Date((mjd - 40587) * 86400000);
export const objectId = (record: OrbitRecord) =>
  record.id ?? record.mpcdesignation ?? record.fulldesignation;

/** Heliocentric AU, converted from ecliptic Z-up to Three's Y-up coordinates. */
export function orbitCoordinates(
  record: OrbitRecord,
  anomaly: number,
  radius: number,
  target = new Vector3(),
) {
  const node = record.node * DEG;
  const argument = anomaly + record.argperi * DEG;
  const inclination = record.i * DEG;
  const x =
    radius *
    (Math.cos(node) * Math.cos(argument) -
      Math.sin(node) * Math.sin(argument) * Math.cos(inclination));
  const y =
    radius *
    (Math.sin(node) * Math.cos(argument) +
      Math.cos(node) * Math.sin(argument) * Math.cos(inclination));
  const z = radius * Math.sin(argument) * Math.sin(inclination);
  return target.set(x, z, -y);
}

/** Two-body propagation of the legacy orbital elements. All epochs are MJD.
 * Newton iterations are bounded, including nearly parabolic elliptic orbits.
 * These osculating elements are a visualization, not a precision ephemeris.
 */
export function orbitPosition(
  record: OrbitRecord,
  mjd: number,
  target = new Vector3(),
): Vector3 {
  const { e, a, q } = record;
  if (
    ![e, a, q, mjd, record.epoch_mjd].every(Number.isFinite) ||
    e < 0 ||
    q <= 0
  )
    return target.set(0, 0, 0);
  if (e < 1) {
    const motion =
      record.mean_motion ?? GAUSSIAN_K / Math.pow(Math.abs(a), 1.5) / DEG;
    const mean =
      ((((record.mean_anomaly + motion * (mjd - record.epoch_mjd)) * DEG) %
        (2 * Math.PI)) +
        2 * Math.PI) %
      (2 * Math.PI);
    let eccentric = e < 0.8 ? mean : Math.PI;
    for (let iteration = 0; iteration < 64; iteration++) {
      const delta =
        (eccentric - e * Math.sin(eccentric) - mean) /
        (1 - e * Math.cos(eccentric));
      eccentric -= delta;
      if (Math.abs(delta) < 1e-12) break;
    }
    const x = a * (Math.cos(eccentric) - e);
    const y = a * Math.sqrt(1 - e * e) * Math.sin(eccentric);
    return orbitCoordinates(record, Math.atan2(y, x), Math.hypot(x, y), target);
  }
  const perihelion = record.peri_time ?? record.epoch_mjd;
  if (e === 1) {
    const h = (1.5 * (mjd - perihelion) * GAUSSIAN_K) / Math.sqrt(2 * q ** 3);
    const root = Math.sqrt(1 + h * h);
    const s = Math.cbrt(root + h) - Math.cbrt(root - h);
    return orbitCoordinates(record, 2 * Math.atan(s), q * (1 + s * s), target);
  }
  const magnitude = q / (e - 1);
  const mean = (GAUSSIAN_K * (mjd - perihelion)) / magnitude ** 1.5;
  let hyperbolic = Math.asinh(mean / e);
  for (let iteration = 0; iteration < 64; iteration++) {
    const delta =
      (e * Math.sinh(hyperbolic) - hyperbolic - mean) /
      (e * Math.cosh(hyperbolic) - 1);
    hyperbolic -= delta;
    if (Math.abs(delta) < 1e-12) break;
  }
  const anomaly =
    2 * Math.atan(Math.sqrt((e + 1) / (e - 1)) * Math.tanh(hyperbolic / 2));
  return orbitCoordinates(
    record,
    anomaly,
    magnitude * (e * Math.cosh(hyperbolic) - 1),
    target,
  );
}

export function orbitPoints(record: OrbitRecord, segments = 256): Vector3[] {
  const maxAnomaly = record.e < 1 ? Math.PI : Math.acos(-1 / record.e) - 0.03;
  return Array.from({ length: segments + 1 }, (_, index) => {
    const angle = -maxAnomaly + (2 * maxAnomaly * index) / segments;
    return orbitCoordinates(
      record,
      angle,
      (record.q * (1 + record.e)) / (1 + record.e * Math.cos(angle)),
    );
  });
}
