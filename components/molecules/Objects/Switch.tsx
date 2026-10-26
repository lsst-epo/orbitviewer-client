"use client";

import type { FunctionComponent } from "react";
import clsx from "clsx/lite";
import LibrarySwitch from "@rubin-epo/epo-react-lib/Switch";
import styles from "./styles.module.css";

export interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  /** What is being switched -- the accessible name. */
  label: string;
  onLabel: string;
  offLabel: string;
}

const Switch: FunctionComponent<SwitchProps> = ({
  checked,
  onChange,
  label,
  onLabel,
  offLabel,
}) => (
  <div className={styles.switch}>
    <span
      className={clsx(styles.switchLabel, !checked && styles.switchActive)}
      aria-hidden
    >
      {offLabel}
    </span>
    <LibrarySwitch
      className={styles.switchControl}
      checked={checked}
      onClick={onChange}
      aria-label={label}
    />
    <span
      className={clsx(styles.switchLabel, checked && styles.switchActive)}
      aria-hidden
    >
      {onLabel}
    </span>
  </div>
);

export default Switch;
