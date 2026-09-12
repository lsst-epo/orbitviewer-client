/**
 * Visual quality tiers.
 *
 * Each tier is a GPU simulation texture size: one texel holds one object's
 * computed position, so width x height is the maximum number of bodies the
 * scene can propagate. Ported from `core/Globals.ts`.
 *
 * The tier also selects which MPC dataset is downloaded, and those get large
 * quickly -- see `MPC_DATASET_BYTES` for the measured sizes.
 */

export type SimQuality = "low" | "medium" | "high" | "ultra" | "ultra2";

export const SIM_QUALITIES: Array<SimQuality> = [
  "low",
  "medium",
  "high",
  "ultra",
  "ultra2",
];

export interface SimSize {
  width: number;
  height: number;
}

export const GPU_SIM_SIZES: Record<SimQuality, SimSize> = {
  low: { width: 128, height: 128 },
  medium: { width: 256, height: 256 },
  high: { width: 512, height: 512 },
  // Note the asymmetry: ultra is 1024x512, not square.
  ultra: { width: 1024, height: 512 },
  ultra2: { width: 1024, height: 1024 },
};

export const particleCount = ({ width, height }: SimSize): number =>
  width * height;

export const PARTICLE_COUNTS: Record<SimQuality, number> = Object.fromEntries(
  SIM_QUALITIES.map((q) => [q, particleCount(GPU_SIM_SIZES[q])])
) as Record<SimQuality, number>;

/**
 * Measured download sizes of the MPC datasets, served uncompressed from GCS
 * (2026-09-11). These are the reason tier selection matters: the jump from
 * low to ultra2 is 6 MB to 343 MB.
 */
export const MPC_DATASET_BYTES: Record<SimQuality, number> = {
  low: 6_059_379,
  medium: 24_200_000,
  high: 96_900_000,
  ultra: 193_800_000,
  ultra2: 360_000_000,
};

export const DEFAULT_QUALITY: SimQuality = "low";

/** localStorage key the legacy used to persist the user's tier choice. */
export const QUALITY_STORAGE_KEY = "rubin-data-profile";

/**
 * Whether a tier has been chosen before.
 *
 * Onboarding keys off this, exactly as the legacy did: the presence of the
 * stored profile is what told it a visit was not the first one.
 */
export const hasStoredQuality = (): boolean => {
  try {
    return window.localStorage.getItem(QUALITY_STORAGE_KEY) !== null;
  } catch {
    // Storage refused. Treating that as "chosen" is the kinder default:
    // the choice cannot be remembered, so asking on every single visit
    // would be worse than not asking at all.
    return true;
  }
};

export const isSimQuality = (value: string): value is SimQuality =>
  (SIM_QUALITIES as Array<string>).includes(value);

/**
 * Renderer settings per tier. Ported from `QUALITY_TIERS` in
 * `gfx/core/RubinRenderer.ts`.
 *
 * Note glow is off entirely at the low tier -- the bloom pass costs a second
 * full scene render plus several blur passes, which the lowest tier cannot
 * afford. Anything relying on glow must degrade gracefully without it.
 */
export interface GFXTier {
  maxPixelRatio: number;
  /** MSAA samples on the scene target. */
  maxSamples: number;
  /** Blur target scale; below 1 blurs cheaper and wider. */
  blurScale: number;
  /** Kernel width: 0 = 5-tap, 1 = 9-tap, 2 = 13-tap. */
  blurQuality: 0 | 1 | 2;
  blurIterations: number;
  glowEnabled: boolean;
  /** Resolution of the Earth cloud layer, for when that effect lands. */
  cloudsWidth: number;
}

export const GFX_TIERS: Record<SimQuality, GFXTier> = {
  low: {
    maxPixelRatio: 1.5,
    maxSamples: 1,
    glowEnabled: false,
    blurIterations: 2,
    blurQuality: 0,
    blurScale: 0.25,
    cloudsWidth: 512,
  },
  medium: {
    maxPixelRatio: 1.5,
    maxSamples: 2,
    glowEnabled: true,
    blurIterations: 2,
    blurQuality: 0,
    blurScale: 0.25,
    cloudsWidth: 512,
  },
  high: {
    maxPixelRatio: 2,
    maxSamples: 4,
    glowEnabled: true,
    blurIterations: 4,
    blurQuality: 2,
    blurScale: 0.5,
    cloudsWidth: 1024,
  },
  ultra: {
    maxPixelRatio: 3,
    maxSamples: 4,
    glowEnabled: true,
    blurIterations: 4,
    blurQuality: 2,
    blurScale: 1,
    cloudsWidth: 2048,
  },
  // The legacy table stopped at "ultra"; ultra2 exists as a simulation size
  // only, so it inherits ultra's renderer settings.
  ultra2: {
    maxPixelRatio: 3,
    maxSamples: 4,
    glowEnabled: true,
    blurIterations: 4,
    blurQuality: 2,
    blurScale: 1,
    cloudsWidth: 2048,
  },
};
