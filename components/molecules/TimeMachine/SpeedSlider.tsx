"use client";

import { useEffect, useId, useState, type FunctionComponent } from "react";
import HorizontalSlider from "@rubin-epo/epo-react-lib/HorizontalSlider";
import {
  hoursPerSecondFromSlider,
  sliderFromHoursPerSecond,
} from "@/lib/solar/speed";
import styles from "./styles.module.css";

/**
 * Simulation rate control.
 *
 * Replaces the legacy `SimpleSlider`, a hand-rolled thumb with document-level
 * mouse, touch and keydown listeners. Two defects went with it:
 *
 *  - dragging ran the pointer position through `smoothstep`, so the thumb did
 *    not track the cursor -- it lagged, then overshot;
 *  - its arrow-key handler was bound to `document` and gated on
 *    `document.activeElement`, so every slider on the page responded to every
 *    keypress that reached the document.
 *
 * epo-react-lib's HorizontalSlider is a real range input underneath, so
 * keyboard, touch and pointer all come for free and stay scoped to the
 * focused control.
 *
 * The slider's own domain is the normalised position, not the rate: the
 * mapping between them is cubic (see lib/solar/speed).
 *
 * That position is held here rather than derived from the rate on every
 * render, because the mapping is not injective. Every position inside the
 * dead zone means zero hours per second, so a derived thumb would be pushed
 * straight back to the centre -- one arrow key press at a time it could never
 * leave real time at all, and a drag would snap back mid-gesture. The rate
 * still wins when it changes from outside, e.g. when Live resets it.
 */

/** Slider granularity. 400 steps across the track. */
const STEP = 0.005;

/** The library's own defaults, restated to satisfy its over-required types. */
const SLIDER_DEFAULTS = {
  ariaValuetext: undefined,
  defaultValue: undefined,
  marks: undefined,
  orientation: "horizontal",
} as const;

type SliderValue = number | readonly number[];

export interface SpeedSliderProps {
  hoursPerSecond: number;
  onChange: (hoursPerSecond: number) => void;
  label: string;
  /** Formatted rate, announced in place of the raw slider position. */
  valueText: string;
}

const SpeedSlider: FunctionComponent<SpeedSliderProps> = ({
  hoursPerSecond,
  onChange,
  label,
  valueText,
}) => {
  const id = useId();
  const [position, setPosition] = useState(() =>
    sliderFromHoursPerSecond(hoursPerSecond)
  );

  // Re-sync only when the rate no longer matches where the thumb is, so an
  // external change (Live, a share link) moves it and the user's own does not.
  useEffect(() => {
    setPosition((current) =>
      hoursPerSecondFromSlider(current) === hoursPerSecond
        ? current
        : sliderFromHoursPerSecond(hoursPerSecond)
    );
  }, [hoursPerSecond]);

  return (
    <div className={styles.speed}>
      <span className={styles.speedLabel} id={id}>
        {label}
      </span>

      <HorizontalSlider
        {...SLIDER_DEFAULTS}
        // The raw position is meaningless, whether read aloud or shown in
        // the thumb's own bubble; the rate is the value in both places.
        ariaValuetext={valueText}
        renderLabel={() => valueText}
        className={styles.slider}
        value={position}
        min={-1}
        max={1}
        step={STEP}
        onChangeCallback={(next: SliderValue) => {
          if (typeof next !== "number") return;
          setPosition(next);
          onChange(hoursPerSecondFromSlider(next));
        }}
      />

      <output className={styles.speedValue} htmlFor={id}>
        {valueText}
      </output>
    </div>
  );
};

export default SpeedSlider;
