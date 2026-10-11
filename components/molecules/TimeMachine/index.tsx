"use client";

import {
  useId,
  useMemo,
  useRef,
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
 * The clock reads in the viewer's own timezone by default, which is what
 * production shows -- the legacy left flatpickr in local time and never said
 * which it meant. Saying which it means is the one thing worth adding, so the
 * zone is a button: it prints the zone in force and switches to the other.
 * Only the display changes. The simulation's date-to-MJD conversion is
 * UTC-based throughout and never sees this.
 *
 * `flatpickr` is not carried over. A native `datetime-local` gives the same
 * calendar and time entry with no dependency, works on touch, and is already
 * keyboard accessible; the legacy's Apply / Cancel / Live footer was three
 * buttons appended to flatpickr's DOM by hand on every open.
 *
 * It is not, however, formattable: a `datetime-local` renders in whatever
 * format the browser chooses. So the field carries both -- the input, which
 * is the real control and the only thing focus and assistive technology
 * reach, and a formatted string painted over it that steps aside the moment
 * the input is focused.
 */

const pad = (value: number): string => String(value).padStart(2, "0");

/** "YYYY-MM-DDTHH:mm" in the zone on display, which is what the input wants. */
const toInputValue = (date: Date, utc: boolean): string => {
  if (utc) return date.toISOString().slice(0, 16);

  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/**
 * Back to a Date, reading the typed wall-clock time in the zone on display.
 *
 * Browsers may hand back seconds as well as minutes, so the parts are matched
 * rather than the string sliced at an assumed length.
 */
const fromInputValue = (value: string, utc: boolean): Date | null => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;

  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const date = utc
    ? new Date(Date.UTC(year, month - 1, day, hour, minute))
    : new Date(year, month - 1, day, hour, minute);

  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * flatpickr's `M j, Y H:i:S` from `layers/TimeMachine.ts`, which is what
 * production prints: `Nov 11, 2026 12:25:07`, uppercased in CSS as
 * `_timemachine.scss` does it.
 *
 * Two formatters rather than one, because a single `Intl` call joins the
 * date and the time with a locale separator -- a comma in `en` -- that the
 * legacy's format string does not have.
 */
const dateFormatters = (locale: string, utc: boolean) => {
  const timeZone = utc ? "UTC" : undefined;

  return {
    day: new Intl.DateTimeFormat(locale, {
      timeZone,
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: new Intl.DateTimeFormat(locale, {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }),
  };
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
  /** Display only; the clock and the URL stay in UTC either way. */
  const [utc, setUtc] = useState(false);
  const [editing, setEditing] = useState(false);
  const dateRef = useRef<HTMLInputElement>(null);
  /**
   * What the user is typing, while they are typing it. A running simulation
   * would otherwise overwrite each segment as it was entered -- the legacy
   * guarded against the same thing with `if (this.flat.isOpen) return`.
   */
  const [draft, setDraft] = useState<string | null>(null);
  const mounted = useMounted();

  const speedLabel = formatSpeed(hoursPerSecond, t("timemachine.realtime"));

  const formatters = useMemo(() => dateFormatters(locale, utc), [locale, utc]);
  const zoneLabel = utc ? t("timemachine.zone.utc") : t("timemachine.zone.local");

  const onDateChange = (value: string) => {
    setDraft(value);

    // Empty until every segment is filled in, so a half-typed date commits
    // nothing.
    const next = fromInputValue(value, utc);
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
      className={clsx(
        styles.timemachine,
        // The object detail dock, not a panel: production shifts the control
        // strip under `.object_template` and leaves it centred while filters
        // or search are open. See the stylesheet.
        params.object && styles.shifted
      )}
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

        <div className={styles.dateField}>
          <input
            ref={dateRef}
            type="datetime-local"
            className={styles.dateInput}
            aria-label={`${t("timemachine.aria")} (${zoneLabel})`}
            min={toInputValue(CLOCK_RANGE.min, utc)}
            max={toInputValue(CLOCK_RANGE.max, utc)}
            // The clock is seeded from `new Date()`, so it has no correct
            // server value; see useMounted.
            value={draft ?? (mounted ? toInputValue(displayDate, utc) : "")}
            onFocus={() => {
              setEditing(true);
              setDraft(mounted ? toInputValue(displayDate, utc) : "");
            }}
            onBlur={() => {
              setEditing(false);
              setDraft(null);
            }}
            onChange={(event) => onDateChange(event.target.value)}
            readOnly={!mounted}
          />

          {/* Decoration over the input, so the field reads as production's
              while the input underneath stays the control. Hidden while the
              input has focus, where the browser's own segments have to show
              for the typing to be visible. */}
          {!editing && (
            <span className={styles.dateDisplay} aria-hidden>
              {mounted
                ? `${formatters.day.format(displayDate)} ${formatters.time.format(displayDate)}`
                : ""}
            </span>
          )}
        </div>

        {/* The native indicator is hidden in CSS and replaced by this, so the
            affordance survives the formatted overlay. `showPicker` is the
            only way to open that calendar from script, and it throws rather
            than no-ops where it is unavailable. */}
        <button
          type="button"
          className={styles.calendar}
          onClick={() => {
            try {
              dateRef.current?.showPicker();
            } catch {
              dateRef.current?.focus();
            }
          }}
          aria-label={t("timemachine.aria")}
        >
          <Icon name="calendar" aria-hidden />
        </button>

        {/* Which zone is on display, and the way to the other one. The
            legacy showed neither and meant local. */}
        <button
          type="button"
          className={styles.zone}
          onClick={() => setUtc((current) => !current)}
          aria-label={
            utc ? t("timemachine.zone.toLocal") : t("timemachine.zone.toUtc")
          }
        >
          {zoneLabel}
        </button>

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
