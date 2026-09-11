"use client";

import type { FunctionComponent } from "react";
import useClientTranslation from "@/lib/i18n/client";
import OrbitMark from "./OrbitMark";
import styles from "./styles.module.css";

/**
 * Full-screen loading state. Replaces `layers/Loader.ts`.
 *
 * Branded, because of what it is covering: the MPC dataset runs from 6 MB to
 * 360 MB and is served uncompressed (`lib/solar/quality.ts`), so on the
 * heavier tiers this is on screen for a while. The legacy never showed a bare
 * progress line -- it put the turning orbit mark over a blurred view of the
 * scene, which is a wait the reader can sit through.
 *
 * The percentage is the port's own addition and has no legacy counterpart:
 * nothing there knew the size of the download. It is worth keeping for the
 * same reason the mark is -- a 360 MB fetch with no readout looks stalled --
 * so it rides along under the copy rather than replacing it.
 */

export interface LoaderProps {
  locale: string;
  /** 0-1. Renders a percentage when the source reports one. */
  progress?: number;
  message?: string;
}

const Loader: FunctionComponent<LoaderProps> = ({
  locale,
  progress,
  message,
}) => {
  const { t } = useClientTranslation(locale);
  const percent =
    progress !== undefined && progress > 0
      ? Math.round(progress * 100)
      : undefined;

  return (
    <div
      className={styles.loader}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={styles.content}>
        <OrbitMark />
        <p className={styles.message}>
          {message ?? t("core.loading")}
          {percent !== undefined && (
            <span className={styles.percent}> {percent}%</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default Loader;
