"use client";

import type { FunctionComponent } from "react";
import useClientTranslation from "@/lib/i18n/client";
import OrbitMark from "./OrbitMark";
import styles from "./styles.module.css";

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
