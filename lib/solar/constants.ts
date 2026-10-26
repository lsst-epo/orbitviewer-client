export const DEG_TO_RAD = Math.PI / 180;

/** Gaussian gravitational constant, in radians per day. */
export const K = 0.01720209895;

export const KM2AU = 6.6846e-9;
export const AU2KM = 1 / KM2AU;

/** Solar radius in km. */
export const SUN_RADIUS = 695700;

/** Reference epoch as a Modified Julian Date: 2000-01-01 12:00 UT (J2000). */
export const EPOCH = 51544.5;

/**
 * Scene units per AU. The scene is modelled at 1000 units to the astronomical
 * unit so that planet radii (tens of thousands of km, i.e. ~1e-4 AU) stay
 * above the precision floor of 32-bit depth buffers.
 */
export const PLANET_SCALE = 1000;

/** Eccentric-anomaly solver tolerance, in radians (0.001 degrees). */
export const E_CONVERGENCE_THRESHOLD = 0.001 * DEG_TO_RAD;

/**
 * Hard cap on Newton-Raphson iterations.
 *
 * The legacy implementation declared this constant but never referenced it --
 * its `while` loops could spin indefinitely on a near-parabolic ellipse that
 * fails to converge. It is enforced here.
 */
export const E_CONVERGE_MAX_ITERATIONS = 10;
