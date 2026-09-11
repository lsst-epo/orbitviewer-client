import type { PlanetId } from "./planets";

/**
 * Per-planet atmospheric shell settings. Ported verbatim from
 * `PlanetAtmosphereSettings` in `gfx/solar/Planet.ts`.
 *
 * These are art direction, not physics: the colours and widths were chosen to
 * read well at the viewer's exaggerated body scale, so they should not be
 * "corrected" against real atmospheric data.
 */
export interface AtmosphereSettings {
  /** Width of the fresnel rim. Larger values push the glow further inward. */
  fresnelWidth: number;
  /** Shell radius as a multiple of the body's own. */
  scale: number;
  /** Rim colour at grazing angles. */
  color1: number;
  /** Colour toward the centre of the disc. */
  color2: number;
  brightness: number;
}

export const PLANET_ATMOSPHERES: Record<PlanetId, AtmosphereSettings> = {
  mercury: {
    color1: 0xffffff,
    color2: 0xeeeeee,
    fresnelWidth: 0.2,
    scale: 1.005,
    brightness: 1.75,
  },
  venus: {
    color1: 0xffff33,
    color2: 0xf4b681,
    fresnelWidth: 0.6,
    scale: 1.01,
    brightness: 1.5,
  },
  earth: {
    color1: 0x0022ee,
    color2: 0xaaffff,
    fresnelWidth: 1.35,
    scale: 1.05,
    brightness: 3.5,
  },
  mars: {
    color1: 0xff3333,
    color2: 0xf4b681,
    fresnelWidth: 0.25,
    scale: 1.005,
    brightness: 3.6,
  },
  jupiter: {
    color1: 0xff6633,
    color2: 0xcccc33,
    fresnelWidth: 5,
    scale: 1.006,
    brightness: 1.5,
  },
  saturn: {
    color1: 0x9966ff,
    color2: 0xccccff,
    fresnelWidth: 6,
    scale: 1.008,
    brightness: 1.5,
  },
  uranus: {
    color1: 0x74e6af,
    color2: 0xeeeeee,
    fresnelWidth: 5,
    scale: 1.02,
    brightness: 1.5,
  },
  neptune: {
    color1: 0x3333ff,
    color2: 0xff0000,
    fresnelWidth: 5,
    scale: 1.04,
    brightness: 1.5,
  },
};

export const atmosphereFor = (id: string): AtmosphereSettings | undefined =>
  PLANET_ATMOSPHERES[id.toLowerCase() as PlanetId];
