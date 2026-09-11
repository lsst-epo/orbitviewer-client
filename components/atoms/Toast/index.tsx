"use client";

import { useEffect, type FunctionComponent } from "react";
import clsx from "clsx/lite";
import Icon from "@/components/atoms/Icon";
import styles from "./styles.module.css";

/**
 * Transient message. Ported from `layers/Toast.ts`, which was a thin
 * show/hide wrapper over a static element.
 *
 * Announced politely rather than assertively: these are informational (a date
 * clamped to its range, a filter with no results), not errors demanding that
 * a screen reader interrupt whatever it is reading.
 */

export interface ToastProps {
  open: boolean;
  message: string;
  onClose: () => void;
  /** Auto-dismiss delay in ms. 0 keeps it up until dismissed. */
  duration?: number;
  /** Accessible label for the dismiss control. */
  closeLabel?: string;
}

const Toast: FunctionComponent<ToastProps> = ({
  open,
  message,
  onClose,
  duration = 6000,
  closeLabel = "Dismiss",
}) => {
  useEffect(() => {
    if (!open || duration <= 0) return;
    const id = setTimeout(onClose, duration);
    return () => clearTimeout(id);
  }, [open, duration, onClose, message]);

  return (
    <div
      className={clsx(styles.toast, open && styles.open)}
      role="status"
      aria-live="polite"
      inert={!open}
    >
      <p className={styles.message}>{message}</p>
      <button
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label={closeLabel}
      >
        <Icon name="close" />
      </button>
    </div>
  );
};

export default Toast;
