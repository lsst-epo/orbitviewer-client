"use client";

import { useId, type FunctionComponent } from "react";
import useClientTranslation from "@/lib/i18n/client";
import styles from "./styles.module.css";

/**
 * Offers to drop to the smallest tier when the scene is struggling.
 *
 * Ported from `components/PerformanceModal.ts`, which identified its own
 * buttons by their CSS class -- `secondary` dismissed, `primary` switched --
 * so restyling either one changed what it did.
 *
 * Shown once per session at most: someone who has declined has said the
 * frame rate is acceptable to them, and asking again is nagging. The legacy
 * had no such guard.
 */
const PerformanceModal: FunctionComponent<{
  locale: string;
  onAccept: () => void;
  onDismiss: () => void;
}> = ({ locale, onAccept, onDismiss }) => {
  const { t } = useClientTranslation(locale);
  const titleId = useId();
  const bodyId = useId();

  return (
    <div
      className={styles.modal}
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
    >
      <h2 className={styles.title} id={titleId}>
        {t("modal.title")}
      </h2>
      <p className={styles.body} id={bodyId}>
        {t("modal.description")}
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={onDismiss}>
          {t("modal.action.secondary")}
        </button>
        <button type="button" className={styles.primary} onClick={onAccept}>
          {t("modal.action.primary")}
        </button>
      </div>
    </div>
  );
};

export default PerformanceModal;
