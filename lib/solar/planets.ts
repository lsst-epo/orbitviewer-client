export type PlanetId =
  | "mercury"
  | "venus"
  | "earth"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune";

export const PLANET_IDS: Array<PlanetId> = [
  "mercury",
  "venus",
  "earth",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
];

/** Equatorial radii in km. */
export const PlanetRadiusMap: Record<PlanetId, number> = {
  mercury: 2440,
  venus: 6052,
  earth: 6371,
  mars: 3390,
  jupiter: 69911,
  saturn: 58232,
  uranus: 25360,
  neptune: 24620,
};

export interface PlanetRotationData {
  /** Obliquity to orbit, degrees. */
  axialTilt: number;
  /** Sidereal rotation period, days. Negative tilt > 90 implies retrograde. */
  period: number;
  /** Prime meridian offset at epoch, degrees. */
  meridian: number;
}

export const PlanetRotationMap: Record<PlanetId, PlanetRotationData> = {
  mercury: { axialTilt: 0.034, period: 58.6462, meridian: 329.5988 },
  venus: { axialTilt: 177.36, period: 243.018, meridian: 160.2 },
  earth: { axialTilt: 23.4392811, period: 0.99722222, meridian: 0 },
  mars: { axialTilt: 25.19, period: 1.02595676, meridian: 176.049863 },
  jupiter: { axialTilt: 3.13, period: 0.41354, meridian: 284.95 },
  saturn: { axialTilt: 26.73, period: 0.44401, meridian: 38.9 },
  uranus: { axialTilt: 97.77, period: 0.71833, meridian: 203.81 },
  neptune: { axialTilt: 28.32, period: 0.66526, meridian: 249.978 },
};

export const isPlanetId = (id: string): id is PlanetId =>
  (PLANET_IDS as Array<string>).includes(id);
