import { SIM_QUALITIES, type SimQuality } from "./quality";

/** How long to measure for, in milliseconds. */
export const BENCHMARK_DURATION = 2000;

/** Frames discarded before measuring, while the scene warms up. */
const WARMUP_FRAMES = 10;

/** Average frame time, in ms, at or below which a tier is offered. */
const THRESHOLDS: Array<{ maxFrameMs: number; quality: SimQuality }> = [
  { maxFrameMs: 17, quality: "high" },
  { maxFrameMs: 30, quality: "medium" },
];

export interface BenchmarkResult {
  /** Mean frame time in milliseconds, excluding warm-up. */
  averageFrameMs: number;
  quality: SimQuality;
}

/**
 * Maps a measured frame time onto a tier.
 *
 * `ultra` is never recommended, as in the legacy: it is a 106 MB download and
 * a deliberate choice, not something to hand someone automatically.
 */
export function recommendQuality(
  averageFrameMs: number,
  isMobile: boolean
): SimQuality {
  if (isMobile) return "low";

  return (
    THRESHOLDS.find(({ maxFrameMs }) => averageFrameMs < maxFrameMs)?.quality ??
    "low"
  );
}

/** Accumulates frame deltas and reports once the window has elapsed. */
export class FrameBenchmark {
  private deltas: Array<number> = [];
  private frames = 0;
  private startedAt: number | null = null;

  /** Call once per frame with the delta in seconds, as useFrame supplies. */
  sample(deltaSeconds: number): void {
    this.frames += 1;

    if (this.frames <= WARMUP_FRAMES) return;

    if (this.startedAt === null) this.startedAt = performance.now();

    this.deltas.push(deltaSeconds * 1000);
  }

  get finished(): boolean {
    return (
      this.startedAt !== null &&
      performance.now() - this.startedAt >= BENCHMARK_DURATION
    );
  }

  result(isMobile: boolean): BenchmarkResult {
    const averageFrameMs = this.deltas.length
      ? this.deltas.reduce((total, delta) => total + delta, 0) /
        this.deltas.length
      : Infinity;

    return {
      averageFrameMs,
      quality: recommendQuality(averageFrameMs, isMobile),
    };
  }
}

/** Tiers offered in the picker, coarsest first. `ultra2` is not public. */
export const OFFERED_QUALITIES: Array<SimQuality> = SIM_QUALITIES.filter(
  (quality) => quality !== "ultra2"
);
