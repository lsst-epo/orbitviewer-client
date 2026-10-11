"use client";

import { useEffect, type FunctionComponent } from "react";
import { expoInOut } from "@/lib/math";
import { useSolarClock } from "@/contexts/SolarClock";
import { useExplorer } from "@/contexts/Explorer";

/**
 * Runs the simulation fast while the splash is up, so the scene behind it is
 * visibly in motion rather than a still. Renders nothing.
 *
 * `goToLandingMode` tweens `CLOCK_SETTINGS.speed` to 100 hours a second over
 * five seconds on `expo.inOut`, and entering the viewer calls `goLive()`.
 *
 * The rate is written to the clock directly and never through the explorer's
 * params, so it stays out of the URL -- only the time machine's slider
 * belongs there.
 *
 * On the way out it restores whatever rate the URL asked for rather than
 * always going live. On the ordinary path there is none, so the effect is
 * the legacy's `goLive()`; on a back-and-forward through the splash it
 * leaves a reader's own choice of rate intact. A separate component because
 * the splash itself is a server component and cannot hold the effect.
 */

const LANDING_HOURS_PER_SECOND = 100;
const RAMP_MS = 5000;

const LandingClock: FunctionComponent = () => {
  const { setHoursPerSecond, goLive } = useSolarClock();
  const { params } = useExplorer();
  const restore = params.timeScale;

  useEffect(() => {
    let frame = 0;
    let start: number | null = null;

    // A ramp is motion for its own sake; anyone who asked for less of it
    // gets the rate without the acceleration.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      setHoursPerSecond(LANDING_HOURS_PER_SECOND);
    } else {
      const step = (now: number) => {
        start ??= now;
        const t = Math.min((now - start) / RAMP_MS, 1);
        setHoursPerSecond(LANDING_HOURS_PER_SECOND * expoInOut(t));
        if (t < 1) frame = requestAnimationFrame(step);
      };

      frame = requestAnimationFrame(step);
    }

    return () => {
      cancelAnimationFrame(frame);
      if (restore === undefined) goLive();
      else setHoursPerSecond(restore);
    };
  }, [setHoursPerSecond, goLive, restore]);

  return null;
};

export default LandingClock;
