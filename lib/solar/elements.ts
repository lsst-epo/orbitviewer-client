import { EPOCH } from "./constants";
import { OrbitElements, OrbitType, SolarCategory } from "./types";
import type { PlanetOrbitElements } from "@/lib/static/planetOrbits";
import type { OrbitElements as HasuraOrbitElements } from "@/lib/api/hasura";
import type { OrbitalMpcRow } from "@/lib/api/mpcData";

/**
 * Maps the two source representations of orbital elements onto the single
 * normalised `OrbitElements` shape the propagators consume.
 *
 * Replaces the legacy `mapOrbitElements` / `mapOrbitElementsV2`.
 */

/** Classifies an orbit from its eccentricity. */
export function getOrbitType(e: number): OrbitType {
  if (e < 0.98) return OrbitType.Elliptical;
  if (e < 1.2) return e === 1 ? OrbitType.Parabolic : OrbitType.NearParabolic;
  return OrbitType.Hyperbolic;
}

/** Craft's objectTypeCode values, keyed by category slug. */
export const CategoryTypeMap: Record<SolarCategory, number> = {
  asteroids: 1,
  "near-earth-objects": 2,
  "trans-neptunian-objects": 3,
  centaurs: 4,
  comets: 5,
  "interstellar-objects": 6,
  "planets-moons": 7,
  "jupiter-trojans": 8,
};

const TypeCategoryMap: Record<number, SolarCategory> = Object.fromEntries(
  Object.entries(CategoryTypeMap).map(([slug, code]) => [code, slug])
) as Record<number, SolarCategory>;

export const categoryFromTypeCode = (code: number): SolarCategory =>
  TypeCategoryMap[code] ?? "asteroids";

/**
 * Display priority when an object carries several type codes. A product
 * decision, ported verbatim -- do not re-sort. See README.
 */
export const CATEGORY_PRIORITY: Array<SolarCategory> = [
  "asteroids",
  "comets",
  "centaurs",
  "interstellar-objects",
  "near-earth-objects",
  "trans-neptunian-objects",
  "jupiter-trojans",
];

/**
 * Resolves MPC type codes to the one category an object displays as, or null.
 * Code 7 is deliberately absent from the priority list -- see README.
 */
export function categoryFromTypeCodes(
  codes: Array<number> | null | undefined
): SolarCategory | null {
  if (!codes?.length) return null;

  let best = Number.POSITIVE_INFINITY;

  for (const code of codes) {
    const category = TypeCategoryMap[code];
    if (!category) continue;
    const rank = CATEGORY_PRIORITY.indexOf(category);
    if (rank > -1 && rank < best) best = rank;
  }

  return best === Number.POSITIVE_INFINITY ? null : CATEGORY_PRIORITY[best];
}

/** Local planet/dwarf-planet JSON (destined for the `planet_orbits` table). */
export function fromPlanetElements(
  el: PlanetOrbitElements,
  category: SolarCategory = "planets-moons"
): OrbitElements {
  return {
    id: el.id,
    fulldesignation: el.fulldesignation,
    N: el.node,
    a: el.a,
    e: el.e,
    i: el.incl,
    w: el.peri,
    M: el.M,
    n: el.n,
    q: el.q,
    Tp: el.tperi,
    epoch: el.epoch ?? EPOCH,
    type: getOrbitType(el.e),
    category,
    rubinDiscovery: false,
  };
}

/** Shifts Hasura's and the MPC's `(-180, 180]` onto the propagators' `[0, 360)`. */
const normaliseMeanAnomaly = (value: number | null): number =>
  value === null ? 0 : value < 0 ? value + 360 : value;

/** Maps one MPC dataset row onto normalised elements. */
export function fromMpcRow(row: OrbitalMpcRow): OrbitElements {
  return {
    id: row.mpcdesignation ?? row.fulldesignation,
    fulldesignation: row.fulldesignation,
    mpcDesignation: row.mpcdesignation,
    N: row.node,
    a: row.a,
    e: row.e,
    i: row.i,
    w: row.argperi,
    // Undefined on an unbound orbit, which `hyperbolicCalc` propagates from
    // `Tp` instead and never reads these.
    M: normaliseMeanAnomaly(row.mean_anomaly),
    n: row.mean_motion ?? 0,
    q: row.q,
    Tp: row.peri_time,
    epoch: row.epoch_mjd ?? EPOCH,
    type: getOrbitType(row.e),
    category: categoryFromTypeCodes(row.object_type) ?? "asteroids",
    rubinDiscovery: row.rubin_discovery,
  };
}

/** Hasura `mpc_orbits` rows. */
export function fromHasuraElements(
  el: HasuraOrbitElements,
  category?: SolarCategory
): OrbitElements {
  return {
    id: el.mpcdesignation ?? el.fulldesignation,
    fulldesignation: el.fulldesignation,
    mpcDesignation: el.mpcdesignation,
    N: el.node,
    a: el.a,
    e: el.e,
    i: el.i,
    w: el.argperi,
    M: el.mean_anomaly < 0 ? el.mean_anomaly + 360 : el.mean_anomaly,
    n: el.mean_motion,
    q: el.q,
    Tp: el.peri_time,
    epoch: el.epoch_mjd ?? EPOCH,
    type: getOrbitType(el.e),
    category: category ?? "asteroids",
    rubinDiscovery: el.rubin_discovery,
  };
}
