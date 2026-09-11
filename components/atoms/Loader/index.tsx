"use client";

import type { FunctionComponent } from "react";
import CircularLoader from "@rubin-epo/epo-react-lib/CircularLoader";
import useClientTranslation from "@/lib/i18n/client";
import styles from "./styles.module.css";

/**
 * Full-screen loading state.
 *
 * The spinner itself is epo-react-lib's CircularLoader; this adds the
 * explorer's copy and progress readout. Replaces `layers/Loader.ts`.
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
      <CircularLoader />
      <p className={styles.message}>
        {message ?? t("core.loading")}
        {percent !== undefined && (
          <span className={styles.percent}> {percent}%</span>
        )}
      </p>
    </div>
  );
};

export default Loader;
