"use client";

import { useEffect, type FunctionComponent } from "react";
import { expoInOut } from "@/lib/math";
import { useSolarClock } from "@/contexts/SolarClock";
import { useExplorer } from "@/contexts/Explorer";

const LANDING_HOURS_PER_SECOND = 100;
const RAMP_MS = 5000;

const LandingClock: FunctionComponent = () => {
  const { setHoursPerSecond, goLive } = useSolarClock();
  const { params } = useExplorer();
  const restore = params.timeScale;

  useEffect(() => {
    let frame = 0;
    let start: number | null = null;

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
