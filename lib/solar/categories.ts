import type { ClassificationRange } from "@/lib/api/hasura";
import { categoryFromTypeCode } from "./elements";
import type { OrbitElements, SolarCategory } from "./types";

/**
 * Filter bounds per object category.
 *
 * Ported from `calculatePropRange` / `calculateDistanceMap` in
 * `core/data/Categories.ts`. Hasura's `classification_ranges` table reports
 * observed minima and maxima per orbital property per object type; this folds
 * those rows into the ranges the filter sliders are bounded by.
 */

export interface Range {
  min: number;
  max: number;
}

export type CategoryRanges = Record<SolarCategory | "totals", Range>;

/**
 * Display bounds for semi-major axis.
 *
 * The ceiling is ported from the legacy: the catalogue contains objects on
 * enormously long orbits, and without it a single one drags the distance
 * slider's range out until it is useless.
 *
 * The floor is NOT in the legacy and is a deliberate correction. Semi-major
 * axis is negative for unbound orbits (a = q / (1 - e), so e > 1 flips the
 * sign), and Hasura reports genuinely negative minima -- TNOs at -221753 AU,
 * comets at -6572. The legacy clamped only the ceiling, so its "Distance from
 * Sun" slider spanned from -221753, which is not a distance. Hyperbolic
 * objects have no meaningful semi-major axis to filter on, so the floor is 0.
 */
const SEMI_MAJOR_AXIS_BOUNDS = { min: 0, max: 500 };

const CATEGORIES: Array<SolarCategory> = [
  "planets-moons",
  "asteroids",
  "centaurs",
  "comets",
  "interstellar-objects",
  "near-earth-objects",
  "trans-neptunian-objects",
  "jupiter-trojans",
];

const emptyRanges = (): CategoryRanges =>
  Object.fromEntries(
    ["totals", ...CATEGORIES].map((key) => [
      key,
      { min: Infinity, max: -Infinity },
    ])
  ) as CategoryRanges;

/**
 * Builds the per-category bounds for one orbital property.
 *
 * @param property  the `observed_property` to read, e.g. "a" or "e"
 * @param ranges    classification rows from Hasura
 * @param planets   planet elements, which are not in the MPC catalogue and so
 *                  have to be measured directly
 */
export function calculateRanges(
  property: string,
  ranges: Array<ClassificationRange>,
  planets: Array<OrbitElements> = []
): CategoryRanges {
  const map = emptyRanges();

  for (const row of ranges) {
    if (row.observed_property !== property) continue;

    const category = categoryFromTypeCode(row.object_type?.[0]);
    const bound = row.observed_range_type;
    if (!category || (bound !== "min" && bound !== "max")) continue;

    map[category][bound] = row.observed_value;
  }

  if (property === "a") {
    for (const category of CATEGORIES) {
      const range = map[category];
      if (Number.isFinite(range.min)) {
        range.min = Math.max(range.min, SEMI_MAJOR_AXIS_BOUNDS.min);
      }
      if (Number.isFinite(range.max)) {
        range.max = Math.min(range.max, SEMI_MAJOR_AXIS_BOUNDS.max);
      }
    }
  }

  // Planets come from their own dataset, so their range is measured rather
  // than looked up.
  if (planets.length > 0) {
    const values = planets
      .map((el) => el[property as keyof OrbitElements])
      .filter((value): value is number => typeof value === "number");

    if (values.length > 0) {
      map["planets-moons"] = {
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }
  }

  // Bounds are collected independently. The table is not uniformly
  // populated -- comets report a minimum with no maximum, and interstellar
  // objects have no rows at all -- so requiring both would silently drop a
  // whole category from the totals.
  const mins = CATEGORIES.map((c) => map[c].min).filter(Number.isFinite);
  const maxes = CATEGORIES.map((c) => map[c].max).filter(Number.isFinite);

  map.totals = {
    min: mins.length ? Math.min(...mins) : SEMI_MAJOR_AXIS_BOUNDS.min,
    max: maxes.length ? Math.max(...maxes) : SEMI_MAJOR_AXIS_BOUNDS.max,
  };

  return map;
}

/** Convenience for the distance filter, which is always semi-major axis. */
export const calculateDistanceRanges = (
  ranges: Array<ClassificationRange>,
  planets: Array<OrbitElements> = []
): CategoryRanges => calculateRanges("a", ranges, planets);
