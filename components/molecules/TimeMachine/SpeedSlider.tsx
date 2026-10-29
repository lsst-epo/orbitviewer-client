"use client";

import {
  useEffect,
  useId,
  useState,
  type CSSProperties,
  type FunctionComponent,
} from "react";
import HorizontalSlider from "@rubin-epo/epo-react-lib/HorizontalSlider";
import {
  hoursPerSecondFromSlider,
  sliderFromHoursPerSecond,
} from "@/lib/solar/speed";
import Icon from "@/components/atoms/Icon";
import styles from "./styles.module.css";

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

  useEffect(() => {
    setPosition((current) =>
      hoursPerSecondFromSlider(current) === hoursPerSecond
        ? current
        : sliderFromHoursPerSecond(hoursPerSecond)
    );
  }, [hoursPerSecond]);

  return (
    <div className={styles.speed}>
      <div className={styles.speedMeta}>
        <span className={styles.speedLabel} id={id}>
          {label}
        </span>

        <output className={styles.speedValue} htmlFor={id}>
          {valueText}
        </output>
      </div>

      <div className={styles.sliderRow}>
        <HorizontalSlider
          {...SLIDER_DEFAULTS}
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

        <span
          className={styles.hints}
          style={{ "--position": position } as CSSProperties}
          aria-hidden
        >
          <span className={styles.hintLeft}>
            <Icon name="chevronLeft" />
          </span>
          <span className={styles.hintRight}>
            <Icon name="chevronRight" />
          </span>
        </span>
      </div>
    </div>
  );
};

export default SpeedSlider;
