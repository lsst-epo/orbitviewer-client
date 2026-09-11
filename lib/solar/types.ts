export type SolarCategory =
  | "trans-neptunian-objects"
  | "near-earth-objects"
  | "interstellar-objects"
  | "comets"
  | "centaurs"
  | "asteroids"
  | "planets-moons"
  | "jupiter-trojans";

export enum OrbitType {
  Elliptical,
  Parabolic,
  NearParabolic,
  Hyperbolic,
}

/**
 * Normalised orbital elements, in the notation used by Schlyter's paper.
 *
 * Both the local planet JSON and the Hasura `mpc_orbits` rows are mapped into
 * this shape by `lib/solar/elements.ts`, so the propagators only ever see one
 * representation.
 */
export interface OrbitElements {
  id: string;
  fulldesignation: string;
  /** Longitude of the ascending node, degrees. */
  N: number;
  /** Semi-major axis, AU. */
  a: number;
  /** Eccentricity. */
  e: number;
  /** Inclination, degrees. */
  i: number;
  /** Argument of perihelion, degrees. */
  w: number;
  /** Mean anomaly at epoch, degrees. */
  M: number;
  /** Mean motion, degrees per day. */
  n: number;
  /** Perihelion distance, AU. */
  q: number;
  /** Time of perihelion passage, MJD. Required for non-elliptical orbits. */
  Tp?: number;
  /** Epoch of the elements, MJD. */
  epoch: number;
  type: OrbitType;
  category: SolarCategory;
  rubinDiscovery: boolean;
  name?: string;
  /** Absolute magnitude. */
  H?: number;
  /** Slope parameter. */
  G?: number;
}
