import { EPOCH } from "./constants";
import { OrbitElements, OrbitType, SolarCategory } from "./types";
import type { PlanetOrbitElements } from "@/lib/static/planetOrbits";
import type { OrbitElements as HasuraOrbitElements } from "@/lib/api/hasura";
import type { MpcOrbitRow } from "@/lib/api/mpcData";

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
 * Display priority when an object carries several type codes.
 *
 * An object can legitimately be both, say, a comet and a centaur; the legacy
 * `getCategory` picked whichever appears earliest in this list. Ported
 * verbatim from `core/data/Categories.ts` -- the order is a product decision,
 * not an arbitrary one, so it must not be re-sorted.
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
 * Resolves a set of MPC type codes to the single category the object is
 * displayed as. Returns null when no code maps to a known category, matching
 * the legacy behaviour.
 *
 * Note code 7 (planets-moons) is deliberately absent from the priority list,
 * exactly as in the legacy: planets come from their own dataset, never from
 * mpc_orbits.
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

/** Maps one MPC dataset row onto normalised elements. */
export function fromMpcRow(row: MpcOrbitRow): OrbitElements {
  return {
    id: row.fulldesignation,
    fulldesignation: row.fulldesignation,
    N: row.node,
    a: row.a,
    e: row.e,
    i: row.i,
    w: row.argperi,
    M: row.mean_anomaly < 0 ? row.mean_anomaly + 360 : row.mean_anomaly,
    n: row.mean_motion,
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
    id: el.fulldesignation,
    fulldesignation: el.fulldesignation,
    N: el.node,
    a: el.a,
    e: el.e,
    i: el.i,
    w: el.argperi,
    // Hasura returns mean anomaly in (-180, 180]; the propagators assume a
    // positive-degree convention.
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
