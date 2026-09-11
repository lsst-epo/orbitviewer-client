import planetElems from "./data/planet_elems.json";
import dwarfPlanetElems from "./data/dwarf_planet_elems.json";

/**
 * Orbital elements for the planets and dwarf planets.
 *
 * STUB: these are destined for a `planet_orbits` Hasura table with a schema
 * that mirrors `mpc_orbits`. Until that table exists, the hardcoded JSON is
 * returned through an async signature so the call sites do not change when
 * the real query lands -- swap the body for a `hasuraQuery` call and nothing
 * upstream needs to move.
 */

export interface PlanetOrbitElements {
  id: string;
  fulldesignation: string;
  datetime_jd: number;
  datetime_str: string;
  e: number;
  q: number;
  incl: number;
  node: number;
  peri: number;
  tperi: number;
  n: number;
  M: number;
  nu: number;
  a: number;
  Q: number;
  P: number;
  epoch: number;
  /** Minor Planet Center H magnitude. Numeric in the source JSON. */
  mpch: number;
  /** Minor Planet Center G slope parameter. Only present on dwarf planets. */
  mpcg?: number | null;
}

export async function getPlanetOrbits(): Promise<Array<PlanetOrbitElements>> {
  // TODO: replace with a query against the `planet_orbits` table.
  return planetElems as Array<PlanetOrbitElements>;
}

export async function getDwarfPlanetOrbits(): Promise<
  Array<PlanetOrbitElements>
> {
  // TODO: replace with a query against the `planet_orbits` table.
  return dwarfPlanetElems as Array<PlanetOrbitElements>;
}
