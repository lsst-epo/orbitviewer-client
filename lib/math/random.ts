/**
 * Seeded pseudo-random numbers.
 *
 * Replaces `Random` from `@fils/math`, which the port plan removes as a
 * dependency. That implementation wrapped a Mersenne Twister; mulberry32 is
 * used here instead -- a few lines, no dependency, and more than good enough
 * for scattering geometry.
 *
 * Deliberately seeded by default. The legacy code left the generator on its
 * implicit seed, so the sun's magnetic field was laid out differently on every
 * load; a fixed seed makes the scene reproducible, which matters when
 * comparing screenshots.
 */

export const DEFAULT_SEED = 0x9e3779b9;

export class Random {
  private state: number;

  constructor(seed: number = DEFAULT_SEED) {
    this.state = seed >>> 0;
  }

  /** Uniform float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Uniform float in [min, max). */
  float(min = 0, max = 1): number {
    return min + (max - min) * this.next();
  }

  /** Uniform integer in [min, max], inclusive of both ends. */
  int(min = 0, max = 1): number {
    return Math.floor(this.float(min, max + 1));
  }

  reset(seed: number = DEFAULT_SEED): void {
    this.state = seed >>> 0;
  }
}
