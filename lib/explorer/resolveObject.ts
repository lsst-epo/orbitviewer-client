import type { OrbitElements } from "@/lib/solar/types";

/**
 * Resolves the URL's `object` id to a body.
 *
 * Ported from `ObjectPage.ts`, which resolved in three steps: Craft slug
 * first, then an exact match on the packed MPC designation in the loaded
 * sample, then an object stashed from cloud search results.
 *
 * Matching is case-sensitive first, because MPC packed designations encode
 * their cycle count in base 62 where "A" is 10 and "a" is 36. A
 * case-insensitive second pass follows only so that links produced while the
 * id was being lowercased still resolve; it can be removed once none are
 * expected to be in circulation.
 */

export interface ResolvableObject {
  id: string;
  fulldesignation?: string;
  mpcDesignation?: string;
}

const candidates = (object: ResolvableObject): Array<string> =>
  [object.id, object.mpcDesignation, object.fulldesignation].filter(
    (value): value is string => Boolean(value)
  );

export function resolveObject<T extends ResolvableObject>(
  id: string | undefined,
  sources: Array<Array<T>>
): T | undefined {
  if (!id) return undefined;

  const all = sources.flat();

  const exact = all.find((object) => candidates(object).includes(id));
  if (exact) return exact;

  const lowered = id.toLowerCase();
  return all.find((object) =>
    candidates(object).some((value) => value.toLowerCase() === lowered)
  );
}

/** Craft elements carry their identity on `elementID` rather than `id`. */
export const resolveCraftElement = <T extends { elementID?: string | null }>(
  elements: Array<T>,
  id: string | undefined
): T | undefined => {
  if (!id) return undefined;

  const exact = elements.find((element) => element?.elementID === id);
  if (exact) return exact;

  const lowered = id.toLowerCase();
  return elements.find(
    (element) => element?.elementID?.toLowerCase() === lowered
  );
};

/**
 * Craft's entry for an object, tried against every identifier it answers to.
 *
 * `resolveCraftElement` alone is not enough once the object has been resolved,
 * because the two sides are keyed differently. Craft stores the unpacked
 * designation -- `1999 RQ36` -- while an element's `id` is the packed one,
 * `J99R36Q`, since `fromMpcRow` prefers `mpcdesignation`. Selecting a body in
 * the scene puts that packed id in the URL, so a lookup on the raw parameter
 * misses, and the detail panel fell back to showing `1999 RQ36` as the name
 * with no designation beneath it -- losing exactly the names that matter,
 * Bennu and the named Trojans among them.
 *
 * The raw parameter is tried first so a link written by hand against Craft's
 * own id still resolves before the dataset has loaded.
 */
export function resolveCraftFor<T extends { elementID?: string | null }>(
  elements: Array<T>,
  object: ResolvableObject | undefined,
  raw: string | undefined
): T | undefined {
  const ids = [raw, ...(object ? candidates(object) : [])];

  for (const id of ids) {
    const found = resolveCraftElement(elements, id);
    if (found) return found;
  }

  return undefined;
}

export type { OrbitElements };
