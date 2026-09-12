"use client";

import {
  useEffect,
  useRef,
  type FunctionComponent,
  type PropsWithChildren,
} from "react";
import clsx from "clsx/lite";
import Icon from "@/components/atoms/Icon";
import styles from "./styles.module.css";

/**
 * A dismissible panel over the explorer.
 *
 * Replaces the legacy `layers/Layer.ts`, which imperatively toggled
 * `aria-hidden`, added open/close classes, awaited a hardcoded animation
 * duration, and attached a global `document.onclick` handler. In React the
 * open state is a prop and the transition is CSS; only the dismissal
 * behaviour needs real logic.
 *
 * Two things the legacy version got wrong and are fixed here:
 *
 *  - it assigned `document.onclick` directly, so any two open layers
 *    clobbered each other's handler. This uses addEventListener with cleanup.
 *  - it had no keyboard dismissal at all. Escape closes.
 *
 * The panel stays mounted when closed so its transition can run, and is made
 * inert so its contents stay out of the tab order and the accessibility tree.
 */

export interface LayerProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the panel. */
  label: string;
  /** Dismiss when a click lands outside the panel. */
  closeOnOutsideClick?: boolean;
  /**
   * Which edge the panel docks to. The toolbar panels come from the left, as
   * in the legacy; the object detail card comes from the right so the two can
   * be open at once.
   */
  side?: "left" | "right";
  /** Accessible name for the close button. Untranslated in the legacy. */
  closeLabel?: string;
  className?: string;
}

const Layer: FunctionComponent<PropsWithChildren<LayerProps>> = ({
  open,
  onClose,
  label,
  closeOnOutsideClick = true,
  side = "left",
  closeLabel = "Close",
  className,
  children,
}) => {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const onPointerDown = (event: MouseEvent) => {
      if (!closeOnOutsideClick) return;
      const panel = panelRef.current;
      if (panel && !panel.contains(event.target as Node)) onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    // Deferred a frame: without this the very click that opened the panel is
    // still propagating and would immediately close it again.
    const id = requestAnimationFrame(() =>
      document.addEventListener("pointerdown", onPointerDown)
    );

    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, onClose, closeOnOutsideClick]);

  return (
    <section
      ref={panelRef}
      className={clsx(
        styles.layer,
        side === "right" && styles.right,
        open && styles.open,
        className
      )}
      aria-label={label}
      aria-hidden={!open}
      // Keeps the closed panel out of the tab order and the a11y tree while
      // leaving it mounted so the transition can play.
      inert={!open}
    >
      <header className={styles.head}>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label={closeLabel}
        >
          <Icon name="close" />
        </button>
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
};

export default Layer;
