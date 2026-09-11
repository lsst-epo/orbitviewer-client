import { Vector3 } from "three";
import { PLANET_SCALE } from "./constants";
import { calculateOrbit, getMeanAnomaly } from "./orbits";
import { MJD2JD, JD2Date, dateToMJD } from "./time";
import type { OrbitElements } from "./types";

/**
 * Derived figures shown in the object detail panel.
 *
 * Ported from `getClosestDateToSun`, `getDistanceFromSunNow` and
 * `getDistanceFromEarthNow` in `core/solar/SolarUtils.ts`.
 *
 * Each takes its reference date as an argument rather than reading a global
 * clock, so the panel can show figures for the simulated date rather than
 * always "now" -- the legacy hardcoded `new Date()` in all three, which meant
 * scrubbing the time machine left these numbers stale.
 */

/** Scratch vectors; these run per render, not per frame, but allocation-free is free. */
const a = new Vector3();
const b = new Vector3();

/**
 * Mean anomaly at the given date, in [0, 360).
 *
 * `getMeanAnomaly` returns an unbounded angle -- it just adds n*(d - epoch) --
 * so it grows past 360 going forward and below 0 going back. The legacy
 * wrapped it with `% 360`, which leaves a negative angle negative: scrubbed to
 * before an object's element epoch, its next perihelion came out up to a full
 * orbital period too late.
 */
export function meanAnomalyAt(
  elements: OrbitElements,
  from: Date = new Date()
): number {
  const angle = getMeanAnomaly(elements, dateToMJD(from)) % 360;
  return angle < 0 ? angle + 360 : angle;
}

/**
 * Date of the object's next perihelion.
 *
 * Steps the mean anomaly forward to 360 degrees and converts the resulting
 * day count back to a date.
 */
export function nextPerihelion(
  elements: OrbitElements,
  from: Date = new Date()
): Date | null {
  if (!elements.n) return null;

  const remaining = (360 - meanAnomalyAt(elements, from)) / elements.n;

  return JD2Date(MJD2JD(dateToMJD(from) + remaining));
}

/** Heliocentric distance in AU at the given date. */
export function distanceFromSun(
  elements: OrbitElements,
  from: Date = new Date()
): number {
  calculateOrbit(elements, dateToMJD(from), a);
  return a.length() / PLANET_SCALE;
}

/**
 * Distance from Earth in AU at the given date.
 *
 * Returns null without Earth's elements rather than silently reporting 0,
 * which is what the legacy did and is indistinguishable from a real answer.
 */
export function distanceFromEarth(
  elements: OrbitElements,
  earth: OrbitElements | undefined,
  from: Date = new Date()
): number | null {
  if (!earth) return null;

  const d = dateToMJD(from);
  calculateOrbit(elements, d, a);
  calculateOrbit(earth, d, b);

  return b.distanceTo(a) / PLANET_SCALE;
}

/** Kilometres to miles, for the dual-unit readouts. */
export const kmToMiles = (km: number): number => km / 1.609;

/**
 * Where a value sits within a range, as 0-1.
 *
 * Drives the comparison bars: the legacy showed each orbital property against
 * the spread for that object's category.
 */
export function normalisedInRange(
  value: number,
  range: { min: number; max: number }
): number {
  if (!Number.isFinite(range.min) || !Number.isFinite(range.max)) return 0;
  if (range.max === range.min) return 0;
  return Math.min(
    Math.max((value - range.min) / (range.max - range.min), 0),
    1
  );
}
