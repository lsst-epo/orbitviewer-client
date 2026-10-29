"use client";

import { useId, useState, type FunctionComponent } from "react";
import Icon from "@/components/atoms/Icon";
import styles from "./styles.module.css";

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
