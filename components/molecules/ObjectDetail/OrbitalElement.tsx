"use client";

import { useId, useState, type FunctionComponent } from "react";
import Icon from "@/components/atoms/Icon";
import styles from "./styles.module.css";

/**
 * One orbital element, with its explanation behind an info toggle.
 *
 * The legacy used a hover tooltip (`TooltipDialog`) that also opened on click
 * and then closed itself after two seconds. That is unreadable on touch and
 * unreachable by keyboard. This is a disclosure instead: the button toggles
 * the text, which stays up until dismissed, and `aria-expanded` /
 * `aria-controls` describe the relationship.
 */

export interface OrbitalElementProps {
  /** The Greek symbol, e.g. "ω". Decorative -- `label` carries the meaning. */
  symbol: string;
  label: string;
  value: string;
  description: string;
  infoLabel: string;
}

const OrbitalElement: FunctionComponent<OrbitalElementProps> = ({
  symbol,
  label,
  value,
  description,
  infoLabel,
}) => {
  const [open, setOpen] = useState(false);
  const descriptionId = useId();

  return (
    <li className={styles.element}>
      <div className={styles.elementRow}>
        <dl className={styles.elementData}>
          <dt className={styles.elementLabel} aria-label={label}>
            {symbol}
          </dt>
          <dd className={styles.elementValue}>{value}</dd>
        </dl>

        <button
          type="button"
          className={styles.info}
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls={descriptionId}
          aria-label={`${infoLabel}: ${label}`}
        >
          <Icon name="info" aria-hidden />
        </button>
      </div>

      <p
        id={descriptionId}
        className={styles.elementDescription}
        hidden={!open}
      >
        {description}
      </p>
    </li>
  );
};

export default OrbitalElement;
