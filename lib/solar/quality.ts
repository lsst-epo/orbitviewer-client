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

export const isSimQuality = (value: string): value is SimQuality =>
  (SIM_QUALITIES as Array<string>).includes(value);
