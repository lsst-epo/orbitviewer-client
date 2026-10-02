import type { OrbitElements } from "@/lib/solar/types";

/**
 * Resolves the URL's `object` id to a body, case-sensitively first. Ported
 * from `ObjectPage.ts`; see README for why case matters.
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
 * The two sides are keyed differently and a raw-parameter lookup misses --
 * see README. Raw parameter first, so hand-written links resolve early.
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
