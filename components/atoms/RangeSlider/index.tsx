"use client";

import { useId, type FunctionComponent } from "react";
import HorizontalSlider from "@rubin-epo/epo-react-lib/HorizontalSlider";
import styles from "./styles.module.css";

/**
 * Two-handle range slider.
 *
 * Replaces the legacy `components/RangeSlider.ts` (428 lines of hand-rolled
 * pointer handling) with epo-react-lib's HorizontalSlider, and exists mainly
 * to absorb a defect in that component's types.
 *
 * HorizontalSliderProps is declared `Pick<ReactSliderProps, ...>` rather than
 * `Partial<Pick<...>>`, so className, ariaValuetext, defaultValue, marks,
 * orientation and step are all typed as required even though they are
 * optional in practice. Supplying them here keeps that noise in one file
 * instead of at every call site.
 */

/**
 * The callback's parameter is inferred as `any` from the library's types, so
 * it is annotated here rather than left implicit.
 */
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

      <output className={styles.readout} htmlFor={id}>
        {format(value[0])} – {format(value[1])}
      </output>

      <HorizontalSlider
        {...SLIDER_DEFAULTS}
        className={styles.slider}
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
    </div>
  );
};

export default RangeSlider;
