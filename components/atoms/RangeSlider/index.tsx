"use client";

import { useId, type FunctionComponent } from "react";
import HorizontalSlider from "@rubin-epo/epo-react-lib/HorizontalSlider";
import styles from "./styles.module.css";

/** The change callback's parameter, annotated: the library's types infer `any`. */
type SliderValue = number | readonly number[];

/** The library's own defaults, restated to satisfy the over-required types. */
const SLIDER_DEFAULTS = {
  ariaValuetext: undefined,
  defaultValue: undefined,
  marks: undefined,
  orientation: "horizontal",
} as const;

export interface RangeSliderProps {
  label: string;
  /** Current [min, max]. */
  value: [number, number];
  min: number;
  max: number;
  step?: number;
  onChange: (value: [number, number]) => void;
  /** Rendered beside the label, e.g. a unit. */
  helper?: string;
  /** Formats the numeric readout. */
  format?: (value: number) => string;
}

const RangeSlider: FunctionComponent<RangeSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  helper,
  format = (n) => String(Math.round(n)),
}) => {
  const id = useId();

  return (
    <div className={styles.field}>
      <div className={styles.header}>
        <span className={styles.label} id={id}>
          {label}
        </span>
        {helper && <span className={styles.helper}>{helper}</span>}
      </div>

      <div className={styles.sliderGroup}>
        <HorizontalSlider
          {...SLIDER_DEFAULTS}
          className={styles.slider}
          renderLabel={({ valueNow }) => format(valueNow)}
          value={value}
          min={min}
          max={max}
          step={step}
          onChangeCallback={(next: SliderValue) => {
            if (Array.isArray(next) && next.length === 2) {
              onChange([next[0], next[1]]);
            }
          }}
        />

        <div className={styles.bounds} aria-hidden>
          <span>{format(min)}</span>
          <span>{format(max)}</span>
        </div>
      </div>
    </div>
  );
};

export default RangeSlider;
