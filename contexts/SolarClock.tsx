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
  /** Any non-zero rate leaves live mode; see the note on the setter. */
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
  /**
   * Simulated seconds elapsed relative to when the clock started, which is
   * what the shaders animate against.
   *
   * Deliberately NOT absolute epoch seconds. Noise functions take this as a
   * coordinate, and at ~1.79e9 a float32 has worse than 0.1 precision -- the
   * cloud shader multiplies it up further and degenerates to a flat field.
   * The legacy `SolarClock.time` had the same relative semantics for exactly
   * this reason; `sun.frag` additionally guards itself with
   * `mod(time, 100000.0)`, which is why the sun survives large values and the
   * clouds do not.
   */
  getSimulationTime: () => number;
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
  /** Origin for simulation-relative time. Fixed at mount. */
  const originRef = useRef((initialDate ?? new Date()).getTime() * 0.001);

  const [displayDate, setDisplayDate] = useState<Date>(dateRef.current);
  const [hoursPerSecond, setHoursPerSecondState] = useState(
    initialHoursPerSecond
  );
  const [isLive, setIsLiveState] = useState(
    !initialDate && !initialHoursPerSecond
  );
  const [paused, setPausedState] = useState(false);

  /**
   * The frame path reads these rather than the state above.
   *
   * `advance` runs from `useFrame`, outside React's render cycle, and a
   * closure over state is a frame or more stale. That is not cosmetic here:
   * while live, `advance` overwrites the date with `new Date()` every frame,
   * so a `setDate` committed between two renders was wiped by the next frame
   * still believing it was live -- the date jumped straight back to now. The
   * legacy avoided this by reading a mutable `SolarClock` each frame; refs
   * are the same idea.
   */
  const modeRef = useRef({
    isLive,
    hoursPerSecond: initialHoursPerSecond,
    paused: false,
  });

  const setPaused = useCallback((next: boolean) => {
    modeRef.current.paused = next;
    setPausedState(next);
  }, []);

  const setIsLive = useCallback((next: boolean) => {
    modeRef.current.isLive = next;
    setIsLiveState(next);
  }, []);

  /**
   * Setting a rate leaves live mode, because the frame path only tracks the
   * real clock while the rate is zero. Without this the two disagree: the
   * simulation scrubs away from now while `isLive` still reports true, and
   * the UI keeps claiming to be live.
   */
  const setHoursPerSecond = useCallback(
    (hours: number) => {
      modeRef.current.hoursPerSecond = hours;
      setHoursPerSecondState(hours);
      if (hours !== 0) setIsLive(false);
    },
    [setIsLive]
  );

  const advance = useCallback((deltaSeconds: number) => {
    const {
      isLive: live,
      hoursPerSecond: rate,
      paused: halted,
    } = modeRef.current;

    if (halted) return;

    if (live && rate === 0) {
      dateRef.current = new Date();
    } else {
      const msPerSecond = rate === 0 ? 1000 : rate * 3600 * 1000;
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
  }, []);

  const setDate = useCallback(
    (date: Date) => {
      const clamped = clampDate(date);
      dateRef.current = clamped;
      setDisplayDate(new Date(clamped));
      setIsLive(false);
    },
    [setIsLive]
  );

  const goLive = useCallback(() => {
    const now = new Date();
    dateRef.current = now;
    modeRef.current.hoursPerSecond = 0;
    setHoursPerSecondState(0);
    setDisplayDate(now);
    setPaused(false);
    setIsLive(true);
  }, [setIsLive, setPaused]);

  const getMJD = useCallback(() => dateToMJD(dateRef.current), []);

  const getSimulationTime = useCallback(
    () => dateRef.current.getTime() * 0.001 - originRef.current,
    []
  );

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
      getSimulationTime,
    }),
    [
      getSimulationTime,
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
