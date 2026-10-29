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

const pad = (value: number): string => String(value).padStart(2, "0");

/** "YYYY-MM-DDTHH:mm" in the zone on display, which is what the input wants. */
const toInputValue = (date: Date, utc: boolean): string => {
  if (utc) return date.toISOString().slice(0, 16);

  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** Back to a Date, reading the typed wall-clock time in the zone on display. */
const fromInputValue = (value: string, utc: boolean): Date | null => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;

  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const date = utc
    ? new Date(Date.UTC(year, month - 1, day, hour, minute))
    : new Date(year, month - 1, day, hour, minute);

  return Number.isNaN(date.getTime()) ? null : date;
};

/** Date and time formatters; separate, so no locale separator joins them. */
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
  const [draft, setDraft] = useState<string | null>(null);
  const mounted = useMounted();

  const speedLabel = formatSpeed(hoursPerSecond, t("timemachine.realtime"));

  const formatters = useMemo(() => dateFormatters(locale, utc), [locale, utc]);
  const zoneLabel = utc
    ? t("timemachine.zone.utc")
    : t("timemachine.zone.local");

  const onDateChange = (value: string) => {
    setDraft(value);

    const next = fromInputValue(value, utc);
    if (!next) return;

    setDate(next);
    setParams({ date: next.toISOString() });
  };

  const onSpeedChange = (next: number) => {
    setHoursPerSecond(next);
    setPaused(false);
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
      className={clsx(styles.timemachine, params.object && styles.shifted)}
      aria-label={t("timemachine.region")}
      data-wizard-step="timemachine"
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

          {!editing && (
            <span className={styles.dateDisplay} aria-hidden>
              {mounted
                ? `${formatters.day.format(displayDate)} ${formatters.time.format(displayDate)}`
                : ""}
            </span>
          )}
        </div>

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
