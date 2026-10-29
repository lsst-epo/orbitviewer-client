/** Fastest rate in either direction, in simulated hours per real second. */
export const MAX_HOURS_PER_SECOND = 1000;

/** Slider travel is cubic in the rate -- see README. */
const CURVE = 3;

/** Travel either side of centre that still means real time. */
const DEAD_ZONE = 0.04;

/** Slider position (-1..1) to hours per real second. */
export function hoursPerSecondFromSlider(position: number): number {
  const magnitude = Math.abs(position);
  if (magnitude <= DEAD_ZONE) return 0;

  const scaled = (magnitude - DEAD_ZONE) / (1 - DEAD_ZONE);

  return Math.sign(position) * MAX_HOURS_PER_SECOND * scaled ** CURVE;
}

/** Hours per real second back to a slider position (-1..1). */
export function sliderFromHoursPerSecond(hoursPerSecond: number): number {
  if (!hoursPerSecond) return 0;

  const magnitude = Math.min(
    Math.abs(hoursPerSecond) / MAX_HOURS_PER_SECOND,
    1
  );
  const scaled = magnitude ** (1 / CURVE);

  return Math.sign(hoursPerSecond) * (DEAD_ZONE + scaled * (1 - DEAD_ZONE));
}

const HOURS_PER_DAY = 24;
const HOURS_PER_WEEK = HOURS_PER_DAY * 7;
/** The legacy's month, and near enough for a rate readout. */
const HOURS_PER_MONTH = HOURS_PER_DAY * 30;

/**
 * A rate as a short label, e.g. "2.5 DAY/s".
 *
 * The unit steps up once a whole one fits, so the number stays readable
 * across the whole range. Zero reads as real time rather than as the legacy's
 * empty string -- the clock is still running, just at 1 second per second,
 * and a blank label says nothing.
 */
export function formatSpeed(hoursPerSecond: number, realTimeLabel: string) {
  if (!hoursPerSecond) return realTimeLabel;

  const magnitude = Math.abs(hoursPerSecond);
  const sign = hoursPerSecond < 0 ? "-" : "";

  if (magnitude >= HOURS_PER_MONTH) {
    return `${sign}${(magnitude / HOURS_PER_MONTH).toFixed(1)} MTH/s`;
  }
  if (magnitude >= HOURS_PER_WEEK) {
    return `${sign}${(magnitude / HOURS_PER_WEEK).toFixed(1)} WEK/s`;
  }
  if (magnitude >= HOURS_PER_DAY) {
    return `${sign}${(magnitude / HOURS_PER_DAY).toFixed(1)} DAY/s`;
  }

  return `${sign}${magnitude.toFixed(1)} HR/s`;
}
