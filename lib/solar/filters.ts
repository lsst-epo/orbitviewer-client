import type { OrbitElements, SolarCategory } from "./types";

/**
 * The active object filters, and the predicate that applies them.
 *
 * Shared deliberately: the particle field dims filtered objects in a shader
 * attribute while the search panel excludes them from its results, and if
 * those two rules drifted apart a search could surface an object that is not
 * visible in the scene.
 *
 * Ported from `Search.isFiltered` and `SolarParticles.updateFilterState`,
 * which were two separate implementations of the same rules in the legacy.
 */

export interface ObjectFilters {
  /** Categories to show. Undefined means all. */
  categories?: Set<SolarCategory>;
  /** Semi-major axis range in AU. Undefined means unbounded. */
  distance?: { min: number; max: number };
  /** Undefined means no filter; true is Rubin only, false excludes Rubin. */
  rubinOnly?: boolean;
}

export function matchesFilters(
  element: OrbitElements,
  { categories, distance, rubinOnly }: ObjectFilters
): boolean {
  if (categories && !categories.has(element.category)) return false;

  if (distance && (element.a < distance.min || element.a > distance.max)) {
    return false;
  }

  if (rubinOnly !== undefined && element.rubinDiscovery !== rubinOnly) {
    return false;
  }

  return true;
}

/** True when nothing is being filtered out. */
export const isUnfiltered = ({
  categories,
  distance,
  rubinOnly,
}: ObjectFilters): boolean =>
  categories === undefined && distance === undefined && rubinOnly === undefined;
