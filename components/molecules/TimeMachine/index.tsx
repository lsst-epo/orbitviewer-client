"use client";

import {
  useId,
  useState,
  type CSSProperties,
  type FunctionComponent,
} from "react";
import clsx from "clsx/lite";
import useClientTranslation from "@/lib/i18n/client";
import useMounted from "@/lib/hooks/useMounted";
import { useExplorer } from "@/contexts/Explorer";
import { useSolarClock, CLOCK_RANGE } from "@/contexts/SolarClock";
import { formatSpeed } from "@/lib/solar/speed";
import Icon from "@/components/atoms/Icon";
import SpeedSlider from "./SpeedSlider";
import styles from "./styles.module.css";

/**
 * Time machine.
 *
 * Ported from `layers/TimeMachine.ts` and `partials/timemachine.njk`: play /
 * pause, the simulated date, a Live toggle, and a collapsible rate slider.
 *
 * Everything is expressed in UTC. The simulation's date-to-MJD conversion is
 * UTC-based, so a local-time control would put the planets somewhere other
 * than where the typed date says -- by up to fourteen hours. The legacy left
 * flatpickr in local time and never said which it meant.
 *
 * `flatpickr` is not carried over. A native `datetime-local` gives the same
 * calendar and time entry with no dependency, works on touch, and is already
 * keyboard accessible; the legacy's Apply / Cancel / Live footer was three
 * buttons appended to flatpickr's DOM by hand on every open.
 */

/** UTC "YYYY-MM-DDTHH:mm", which is what datetime-local wants. */
const toInputValue = (date: Date): string => date.toISOString().slice(0, 16);

/**
 * Back to a Date, read as UTC.
 *
 * Browsers may hand back seconds as well as minutes, so the time is
 * normalised before the zone is appended rather than assuming a length.
 */
const fromInputValue = (value: string): Date | null => {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;

  const [, day, hour, minute] = match;
  const date = new Date(`${day}T${hour}:${minute}:00Z`);

  return Number.isNaN(date.getTime()) ? null : date;
};

const TimeMachine: FunctionComponent<{ locale: string }> = ({ locale }) => {
  const { t } = useClientTranslation(locale);
  const { params, setParams } = useExplorer();
  const {
    displayDate,
    hoursPerSecond,
    setHoursPerSecond,
    isLive,
    paused,
    setPaused,
    setDate,
    goLive,
  } = useSolarClock();

  const bodyId = useId();
  const [expanded, setExpanded] = useState(true);
  /**
   * What the user is typing, while they are typing it. A running simulation
   * would otherwise overwrite each segment as it was entered -- the legacy
   * guarded against the same thing with `if (this.flat.isOpen) return`.
   */
  const [draft, setDraft] = useState<string | null>(null);
  const mounted = useMounted();

  const speedLabel = formatSpeed(hoursPerSecond, t("timemachine.realtime"));

  const onDateChange = (value: string) => {
    setDraft(value);

    // Empty until every segment is filled in, so a half-typed date commits
    // nothing.
    const next = fromInputValue(value);
    if (!next) return;

    setDate(next);
    // Written to the URL only on an explicit change. Mirroring the clock
    // every tick would rewrite history sixty times a second and leave a
    // share link pointing at an arbitrary instant mid-scrub.
    setParams({ date: next.toISOString() });
  };

  const onSpeedChange = (next: number) => {
    setHoursPerSecond(next);
    setPaused(false);
    // Rounded for the URL only. The curve produces values like
    // 18.741607666015625, and that precision is neither meaningful nor
    // wanted in a link; it is finer than one step of the slider.
    setParams({
      timeScale: next === 0 ? undefined : Number(next.toFixed(3)),
    });
  };

  const onGoLive = () => {
    goLive();
    setParams({ date: undefined, timeScale: undefined });
  };

  return (
    <section
      className={clsx(styles.timemachine, params.panel && styles.shifted)}
      aria-label={t("timemachine.region")}
      data-wizard-step="timemachine"
      // Ties the rate animation to how fast the simulation is running.
      style={
        { "--speed": `${speedDuration(hoursPerSecond)}s` } as CSSProperties
      }
    >
      <div className={styles.head}>
        <button
          type="button"
          className={clsx(styles.play, !paused && styles.playing)}
          onClick={() => setPaused(!paused)}
          aria-label={paused ? t("timemachine.play") : t("timemachine.pause")}
        >
          <span className={styles.ring} aria-hidden />
          <Icon name={paused ? "play" : "pause"} aria-hidden />
        </button>

        <input
          type="datetime-local"
          className={styles.date}
          aria-label={`${t("timemachine.aria")} (UTC)`}
          min={toInputValue(CLOCK_RANGE.min)}
          max={toInputValue(CLOCK_RANGE.max)}
          // The clock is seeded from `new Date()`, so it has no correct
          // server value; see useMounted.
          value={draft ?? (mounted ? toInputValue(displayDate) : "")}
          onFocus={() => setDraft(mounted ? toInputValue(displayDate) : "")}
          onBlur={() => setDraft(null)}
          onChange={(event) => onDateChange(event.target.value)}
          readOnly={!mounted}
        />

        {/* The field is UTC, and a bare date that is silently not local is
            worse than one that says so. */}
        <span className={styles.zone} aria-hidden>
          UTC
        </span>

        <button
          type="button"
          className={clsx(styles.live, isLive && styles.liveActive)}
          onClick={onGoLive}
          // A toggle that is already on, rather than a disabled control: the
          // legacy disabled the checkbox while live, which removes it from
          // the tab order and leaves its state unannounced.
          aria-pressed={isLive}
        >
          {t("timemachine.live")}
        </button>

        <button
          type="button"
          className={styles.toggle}
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-controls={bodyId}
          aria-label={
            expanded ? t("timemachine.toggle.aria") : t("timemachine.expand")
          }
        >
          {!expanded && <span className={styles.rate}>{speedLabel}</span>}
          <Icon name={expanded ? "chevronDown" : "chevronUp"} aria-hidden />
        </button>
      </div>

      <div className={styles.body} id={bodyId} hidden={!expanded}>
        <SpeedSlider
          hoursPerSecond={hoursPerSecond}
          onChange={onSpeedChange}
          label={t("timemachine.speed")}
          valueText={speedLabel}
        />
      </div>
    </section>
  );
};

/** Seconds per turn of the play button's ring, from the simulation rate. */
function speedDuration(hoursPerSecond: number): number {
  if (!hoursPerSecond) return 4;
  return Math.max(0.3, 4 / Math.abs(hoursPerSecond) ** 0.25);
}

export default TimeMachine;
