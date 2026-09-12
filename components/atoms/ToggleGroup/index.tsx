"use client";

import { useId, type FunctionComponent } from "react";
import clsx from "clsx/lite";
import styles from "./styles.module.css";

/**
 * Segmented single-choice control.
 *
 * Ported from `components/ToggleGroup.ts`. epo-react-lib has no equivalent --
 * Select is a dropdown, which is the wrong affordance for two or three
 * always-visible options.
 *
 * Built as a radiogroup rather than a row of buttons, so arrow keys move
 * between options and screen readers announce the selection state. The legacy
 * used plain buttons and conveyed the active option through a class alone.
 */

export interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

export interface ToggleGroupProps<T extends string> {
  label: string;
  options: Array<ToggleOption<T>>;
  value: T;
  onChange: (value: T) => void;
}

const ToggleGroup = <T extends string>({
  label,
  options,
  value,
  onChange,
}: ToggleGroupProps<T>) => {
  const id = useId();

  return (
    <div className={styles.field}>
      <span className={styles.label} id={id}>
        {label}
      </span>
      <div className={styles.group} role="radiogroup" aria-labelledby={id}>
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              // Only the selected option is tabbable; arrow keys move within
              // the group, which is the expected radiogroup behaviour.
              tabIndex={selected ? 0 : -1}
              className={clsx(styles.option, selected && styles.selected)}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => {
                if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
                  return;
                }
                event.preventDefault();
                const index = options.findIndex((o) => o.value === value);
                const delta = event.key === "ArrowRight" ? 1 : -1;
                const next =
                  options[(index + delta + options.length) % options.length];
                onChange(next.value);
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ToggleGroup as <T extends string>(
  props: ToggleGroupProps<T>
) => ReturnType<FunctionComponent>;
