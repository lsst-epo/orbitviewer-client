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
  /**
   * Stable identifier, and what goes in the URL.
   *
   * For MPC objects this is the PACKED provisional designation ("K14UI9F"),
   * not the unpacked one ("2014 UF189") -- the legacy chose packed because it
   * is compact and has no spaces. Case is significant: the packed format
   * encodes the cycle count in base 62, where "A" is 10 but "a" is 36, so
   * lowercasing changes what the identifier means. For Craft-authored bodies
   * this is the element id ("earth", "ceres").
   */
  id: string;
  /** Human-readable designation, e.g. "2014 UF189". */
  fulldesignation: string;
  /** Packed MPC designation, when the object has one. */
  mpcDesignation?: string;
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
