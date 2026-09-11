"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type FunctionComponent,
  type PropsWithChildren,
} from "react";
import { dateToMJD } from "@/lib/solar/time";

/**
 * Simulation clock.
 *
 * Replaces the legacy `SolarClock` class. The current date lives in a ref
 * rather than state: the scene reads it every frame from `useFrame`, and
 * re-rendering React 60 times a second to carry a timestamp would be wasteful.
 * A throttled state mirror drives the UI readout instead.
 */

/** Simulation is clamped to the range the MPC elements are valid over. */
export const CLOCK_RANGE = {
  min: new Date("1900-01-01T00:00:00Z"),
  max: new Date("2100-01-01T00:00:00Z"),
};

/** How often the React-visible date mirror updates, in ms. */
const UI_SYNC_INTERVAL = 100;

interface SolarClockValue {
  /** Live simulation date. Mutable; read inside useFrame, never in render. */
  dateRef: React.RefObject<Date>;
  /** Throttled mirror of dateRef for UI display. */
  displayDate: Date;
  /** Simulated hours elapsed per real second. 0 is real time. */
  hoursPerSecond: number;
  setHoursPerSecond: (hours: number) => void;
  /** True while the clock tracks the real current time. */
  isLive: boolean;
  paused: boolean;
  setPaused: (paused: boolean) => void;
  /** Jump to a date; leaves live mode. */
  setDate: (date: Date) => void;
  /** Return to tracking the real current time. */
  goLive: () => void;
  /** Advances the clock. Call once per frame from a single useFrame driver. */
  advance: (deltaSeconds: number) => void;
  /** Current simulation date as a Modified Julian Date. */
  getMJD: () => number;
}

const SolarClockContext = createContext<SolarClockValue | null>(null);

const clampDate = (date: Date): Date => {
  const t = date.getTime();
  if (t < CLOCK_RANGE.min.getTime()) return new Date(CLOCK_RANGE.min);
  if (t > CLOCK_RANGE.max.getTime()) return new Date(CLOCK_RANGE.max);
  return date;
};

interface SolarClockProviderProps {
  initialDate?: Date;
  initialHoursPerSecond?: number;
}

const SolarClockProvider: FunctionComponent<
  PropsWithChildren<SolarClockProviderProps>
> = ({ children, initialDate, initialHoursPerSecond = 0 }) => {
  const dateRef = useRef<Date>(initialDate ?? new Date());
  const lastSyncRef = useRef(0);

  const [displayDate, setDisplayDate] = useState<Date>(dateRef.current);
  const [hoursPerSecond, setHoursPerSecond] = useState(initialHoursPerSecond);
  const [isLive, setIsLive] = useState(!initialDate);
  const [paused, setPaused] = useState(false);

  const advance = useCallback(
    (deltaSeconds: number) => {
      if (paused) return;

      if (isLive && hoursPerSecond === 0) {
        dateRef.current = new Date();
      } else {
        const msPerSecond =
          hoursPerSecond === 0 ? 1000 : hoursPerSecond * 3600 * 1000;
        dateRef.current = clampDate(
          new Date(dateRef.current.getTime() + deltaSeconds * msPerSecond)
        );
      }

      // Throttled mirror into React state for the UI.
      const now = performance.now();
      if (now - lastSyncRef.current > UI_SYNC_INTERVAL) {
        lastSyncRef.current = now;
        setDisplayDate(new Date(dateRef.current));
      }
    },
    [paused, isLive, hoursPerSecond]
  );

  const setDate = useCallback((date: Date) => {
    const clamped = clampDate(date);
    dateRef.current = clamped;
    setDisplayDate(new Date(clamped));
    setIsLive(false);
  }, []);

  const goLive = useCallback(() => {
    const now = new Date();
    dateRef.current = now;
    setDisplayDate(now);
    setHoursPerSecond(0);
    setIsLive(true);
  }, []);

  const getMJD = useCallback(() => dateToMJD(dateRef.current), []);

  const value = useMemo<SolarClockValue>(
    () => ({
      dateRef,
      displayDate,
      hoursPerSecond,
      setHoursPerSecond,
      isLive,
      paused,
      setPaused,
      setDate,
      goLive,
      advance,
      getMJD,
    }),
    [
      displayDate,
      hoursPerSecond,
      isLive,
      paused,
      setDate,
      goLive,
      advance,
      getMJD,
    ]
  );

  return (
    <SolarClockContext.Provider value={value}>
      {children}
    </SolarClockContext.Provider>
  );
};

export const useSolarClock = (): SolarClockValue => {
  const context = useContext(SolarClockContext);

  if (!context) {
    throw new Error("useSolarClock must be used within a SolarClockProvider");
  }

  return context;
};

export default SolarClockProvider;
