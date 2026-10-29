"use client";

import { useId, type FunctionComponent } from "react";
import clsx from "clsx/lite";
import Icon, { type IconName } from "@/components/atoms/Icon";
import type { Range } from "@/lib/solar/categories";
import styles from "./styles.module.css";

/** How close to an end the thumb may sit before its bubble is re-aligned. */
const EDGE_MARGIN = 0.15;

export interface GraphProps {
  label: string;
  /** Shown next to the label -- the legacy put the property name here. */
  detail?: string;
  value: number;
  range: Range;
  format: (value: number) => string;
  icons?: [IconName?, IconName?];
}

const Graph: FunctionComponent<GraphProps> = ({
  label,
  detail,
  value,
  range,
  format,
  icons = [],
}) => {
  const labelId = useId();
  const [startIcon, endIcon] = icons;

  const span = range.max - range.min;
  const fraction =
    span > 0 ? Math.min(Math.max((value - range.min) / span, 0), 1) : 0;

  return (
    <div className={styles.graph}>
      <div className={styles.graphHead}>
        <h4 className={styles.graphLabel} id={labelId}>
          {label}
        </h4>
        {detail && <p className={styles.graphDetail}>{detail}</p>}
      </div>

      <div className={styles.graphBody}>
        {startIcon && (
          <Icon name={startIcon} className={styles.graphIcon} aria-hidden />
        )}

        <div
          className={styles.progress}
          role="meter"
          aria-labelledby={labelId}
          aria-valuenow={value}
          aria-valuemin={range.min}
          aria-valuemax={range.max}
          aria-valuetext={format(value)}
        >
          <div
            className={styles.progressFill}
            style={{ width: `${fraction * 100}%` }}
          >
            <span className={styles.thumb} aria-hidden>
              <span
                className={clsx(
                  styles.tooltip,
                  fraction > 1 - EDGE_MARGIN && styles.tooltipEnd,
                  fraction < EDGE_MARGIN && styles.tooltipStart
                )}
              >
                {format(value)}
              </span>
            </span>
          </div>
        </div>

        {endIcon && (
          <Icon name={endIcon} className={styles.graphIcon} aria-hidden />
        )}
      </div>

      <div className={styles.graphScale} aria-hidden>
        <span>{format(range.min)}</span>
        <span>{format(range.max)}</span>
      </div>
    </div>
  );
};

export default Graph;
