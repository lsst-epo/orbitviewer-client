"use client";

import type { FunctionComponent } from "react";
import clsx from "clsx/lite";
import LibrarySwitch from "@rubin-epo/epo-react-lib/Switch";
import styles from "./styles.module.css";

/**
 * Visibility switch with a label on either side.
 *
 * Ported from the legacy `togglegroup.njk` as it was used in `objects.njk`:
 * two static labels with the active one highlighted, around a toggle.
 *
 * The labels are decorative here -- they restate the switch's two states, and
 * a screen reader already gets that from `role="switch"` plus `aria-checked`.
 * The switch itself carries the category name, so it announces as e.g.
 * "Comets, switch, on" rather than the legacy's unnamed checkbox.
 */

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
    <LibrarySwitch checked={checked} onClick={onChange} aria-label={label} />
    <span
      className={clsx(styles.switchLabel, checked && styles.switchActive)}
      aria-hidden
    >
      {onLabel}
    </span>
  </div>
);

export default Switch;
