"use client";

import { useEffect, useRef, useState, type FunctionComponent } from "react";
import { expoInOut } from "@/lib/math";
import styles from "./styles.module.css";

/**
 * The discovery figure, counting up on arrival.
 *
 * Ported from `OrbitViewerPage.transitionIn`, which tweened a plain object
 * from `total - 2000` to `total` over three seconds on `expo.inOut` and wrote
 * `toLocaleString()` into the element on every frame. gsap is not a
 * dependency here, so the easing is inlined and the loop is rAF.
 *
 * The 2000 is a fixed run-up, not a proportion: the point is a figure that
 * visibly climbs, not one that starts from zero.
 */

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

  /**
   * Seeded with the real figure, not the run-up, and stepped back to the
   * run-up by the first animation frame rather than on mount.
   *
   * That ordering is the whole trick. `requestAnimationFrame` does not fire
   * in a background tab, so an animation that starts by rendering
   * `total - 2000` leaves anyone who opened the splash in a background tab
   * staring at a plausible-looking wrong number. Deriving the start from the
   * first frame means the figure is correct unless the climb is actually
   * running, with no need to ask the document whether it is visible --
   * which is worth avoiding, since `document.hidden` can report `true` in an
   * embedded pane that is painting and servicing rAF perfectly well.
   */
  const [value, setValue] = useState(total);
  const frame = useRef(0);

  useEffect(() => {
    // Anyone who has asked for less motion gets the figure, not the climb.
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
      {/*
        The live region announces the settled figure once rather than every
        frame of the count, which would be unusable read aloud -- hence
        `aria-label` on the element and the digits hidden from the tree.
      */}
      <p className={styles.countValue} role="status" aria-label={announcement}>
        <span aria-hidden="true">{value.toLocaleString(locale)}</span>
      </p>
    </div>
  );
};

export default DiscoveryCount;
