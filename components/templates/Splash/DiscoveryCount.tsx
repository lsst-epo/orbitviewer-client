"use client";

import { useEffect, useRef, useState, type FunctionComponent } from "react";
import { expoInOut } from "@/lib/math";
import styles from "./styles.module.css";

const RUN_UP = 2000;
const DURATION_MS = 3000;

export interface DiscoveryCountProps {
  total: number;
  label?: string | null;
  locale: string;
  /** Accessible phrasing for the finished figure, e.g. "35,000 discoveries". */
  announcement: string;
}

const DiscoveryCount: FunctionComponent<DiscoveryCountProps> = ({
  total,
  label,
  locale,
  announcement,
}) => {
  const from = Math.max(0, total - RUN_UP);

  /* Seeded with the real figure, not the run-up: rAF does not fire in a
     background tab, so starting at `total - RUN_UP` would strand that reader
     on a plausible wrong number. Stepped back by the first frame instead. */
  const [value, setValue] = useState(total);
  const frame = useRef(0);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      return;
    }

    let start: number | null = null;

    const step = (now: number) => {
      start ??= now;
      const t = Math.min((now - start) / DURATION_MS, 1);
      setValue(Math.round(from + (total - from) * expoInOut(t)));
      if (t < 1) frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame.current);
  }, [from, total]);

  return (
    <div className={styles.count}>
      <p className={styles.countLabel}>{label}</p>
      <p className={styles.countValue} role="status" aria-label={announcement}>
        <span aria-hidden="true">{value.toLocaleString(locale)}</span>
      </p>
    </div>
  );
};

export default DiscoveryCount;
