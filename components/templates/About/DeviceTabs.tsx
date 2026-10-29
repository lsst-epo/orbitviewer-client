"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FunctionComponent,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import clsx from "clsx/lite";
import styles from "./styles.module.css";

const ROTATE_INTERVAL = 5000;
const COUNT_DURATION = 800;

export interface DeviceTier {
  key: string;
  label: string;
  /** Craft's formatted count, e.g. "500,000 objects". */
  count: string;
  image?: { url: string; width: number; height: number; alt?: string | null };
  /** Aspect ratio of the mask, as the CSS `aspect-ratio` value. */
  ratio: string;
}

/** Splits a count string into the number to animate and the text around it. */
const splitCount = (
  count: string
): { value: number; prefix: string; suffix: string } | null => {
  /* Separators only BETWEEN digits, so a trailing one -- or the space before
     "objects" -- stays in the suffix rather than being eaten. */
  const match = count.match(/\d+(?:[,.\u202f\u00a0 ]\d+)*/);
  if (!match) return null;

  const value = Number(match[0].replace(/\D/g, ""));
  if (!Number.isFinite(value)) return null;

  const start = match.index ?? 0;

  return {
    value,
    prefix: count.slice(0, start),
    suffix: count.slice(start + match[0].length),
  };
};

/** Counts from one figure to the next; renders the text as authored. */
const Count: FunctionComponent<{ count: string; locale: string }> = ({
  count,
  locale,
}) => {
  const target = splitCount(count);
  const value = target?.value ?? 0;
  const [shown, setShown] = useState(value);
  /* Kept in a ref as well as in state: an effect closing over `shown` reads
     the value from the render that created it, not the current one. */
  const shownRef = useRef(value);

  useEffect(() => {
    const from = shownRef.current;
    if (from === value) return;

    const settle = (next: number) => {
      shownRef.current = next;
      setShown(next);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      settle(value);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - start) / COUNT_DURATION, 1);
      const eased = 1 - (1 - progress) ** 3;
      settle(Math.round(from + (value - from) * eased));

      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [value]);

  if (!target) return <p className={styles.count}>{count}</p>;

  return (
    <p className={styles.count}>
      {target.prefix}
      {shown.toLocaleString(locale)}
      {target.suffix}
    </p>
  );
};

export interface DeviceTabsProps {
  tiers: Array<DeviceTier>;
  locale: string;
  label: string;
}

const DeviceTabs: FunctionComponent<DeviceTabsProps> = ({
  tiers,
  locale,
  label,
}) => {
  const baseId = useId();
  const [selected, setSelected] = useState(0);
  const [rotating, setRotating] = useState(true);
  const [engaged, setEngaged] = useState(false);
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!rotating || engaged || tiers.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(
      () => setSelected((current) => (current + 1) % tiers.length),
      ROTATE_INTERVAL
    );

    return () => window.clearInterval(id);
  }, [rotating, engaged, tiers.length]);

  const select = (index: number) => {
    setEngaged(true);
    setSelected(index);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const offset =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!offset) return;

    event.preventDefault();
    const next = (selected + offset + tiers.length) % tiers.length;
    select(next);
    tabsRef.current[next]?.focus();
  };

  const active = tiers[selected];

  return (
    <div
      className={styles.device}
      onMouseEnter={() => setRotating(false)}
      onMouseLeave={() => setRotating(true)}
      onFocus={() => setRotating(false)}
      onBlur={() => setRotating(true)}
    >
      <div
        className={styles.mask}
        style={{ aspectRatio: active.ratio }}
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${selected}`}
      >
        <Count count={active.count} locale={locale} />

        {active.image && (
          <Image
            key={active.key}
            className={styles.shot}
            src={active.image.url}
            alt={active.image.alt ?? ""}
            width={active.image.width}
            height={active.image.height}
            sizes="(max-width: 64rem) 100vw, 60rem"
          />
        )}
      </div>

      <div className={styles.tabs} role="tablist" aria-label={label}>
        {tiers.map((tier, index) => (
          <button
            key={tier.key}
            ref={(element) => {
              tabsRef.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${index}`}
            aria-selected={index === selected}
            aria-controls={`${baseId}-panel`}
            tabIndex={index === selected ? 0 : -1}
            className={clsx(styles.tab, index === selected && styles.tabActive)}
            onClick={() => select(index)}
            onKeyDown={onKeyDown}
          >
            {tier.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DeviceTabs;
