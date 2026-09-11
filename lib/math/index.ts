export * from "./random";

/**
 * Small numeric helpers, replacing `MathUtils` from `@fils/math`. three's own
 * MathUtils covers most of this; these are the ones it does not export with
 * the same semantics.
 */

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

/** Hermite interpolation between two edges, matching GLSL's smoothstep. */
export const smoothstep = (min: number, max: number, value: number): number => {
  if (min === max) return value < min ? 0 : 1;
  const t = clamp((value - min) / (max - min), 0, 1);
  return t * t * (3 - 2 * t);
};

export const map = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);

/**
 * gsap's `expo.inOut`, which the legacy uses for both the discovery count-up
 * and the splash's clock ramp. Inlined because gsap is not a dependency here.
 */
export const expoInOut = (t: number): number => {
  if (t === 0 || t === 1) return t;

  return t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2;
};
