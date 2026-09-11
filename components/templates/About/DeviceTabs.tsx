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

/**
 * The quality-tier showcase.
 *
 * Ported from `components/AboutCarousel.ts` and the `.about_device` block.
 * Each tier gets a screenshot inside a mask whose aspect ratio stands for the
 * device it suits -- ultrawide down to a phone -- and an object count that
 * counts up to the new figure when the tier changes.
 *
 * Built as a real tablist: the legacy had `role="tab"` buttons with no
 * `tablist` parent, no `tabpanel`, and no keyboard handling, so the roles
 * described a widget that did not exist. Arrow keys move between tabs here,
 * per the APG pattern.
 *
 * The legacy rotated every three seconds and only ever stopped when scrolled
 * out of view, with no way to halt it (WCAG 2.2.2). Here it stops for good on
 * the first interaction -- the reader has taken control -- pauses on hover and
 * focus, and does not start at all under `prefers-reduced-motion`.
 */

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

/**
 * Splits a count string into the number to animate and the text around it.
 *
 * Craft authors these as free text ("500,000 objects"), so the numeral is
 * found rather than assumed. If there is nothing to find the string is shown
 * as written and the animation is simply skipped -- the legacy read its
 * figures from a second source, the copy file, which could disagree with the
 * CMS.
 */
const splitCount = (
  count: string
): { value: number; prefix: string; suffix: string } | null => {
  // Group separators only between digits, so a trailing separator or the
  // space before "objects" stays in the suffix rather than being eaten.
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
  /**
   * The figure currently on screen. Kept in a ref as well as in state so the
   * next animation can start from wherever this one got to, without the
   * effect having to close over `shown` -- a closure there is fixed at the
   * render that created the effect, and by the time it is read the figure has
   * moved on, so the animation starts from the wrong number and sometimes
   * concludes it has nothing to do.
   */
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
      // Ease out, so the figure settles rather than stopping dead.
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
    // The reader has chosen a tier, so stop rotating for good rather than
    // moving the panel out from under them a few seconds later.
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
      // Hover and focus pause the rotation; leaving resumes it, unless the
      // reader has already picked a tier.
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
            // Only the selected tab is in the tab order; arrows move between
            // them. This is the APG tablist pattern the legacy's roles implied.
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
