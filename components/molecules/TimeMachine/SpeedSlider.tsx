"use client";

import { useEffect, useId, useState, type FunctionComponent } from "react";
import HorizontalSlider from "@rubin-epo/epo-react-lib/HorizontalSlider";
import {
  hoursPerSecondFromSlider,
  sliderFromHoursPerSecond,
} from "@/lib/solar/speed";
import styles from "./styles.module.css";

/**
 * Simulation rate control. Its domain is the normalised position, not the
 * rate -- the mapping is cubic (`lib/solar/speed`) and not injective, so the
 * position is held rather than derived. See README.
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
