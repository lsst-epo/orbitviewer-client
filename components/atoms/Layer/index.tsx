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

export interface LayerProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the panel. */
  label: string;
  /** Dismiss when a click lands outside the panel. */
  closeOnOutsideClick?: boolean;
  /**
   * Placement: a full-height drawer (`left`/`right`), the object detail's
   * floating card (`dock`), or the filters panel's smaller one (`card`).
   */
  side?: "left" | "right" | "dock" | "card";
  /** `wide` for content laid out as a row; `full` is the objects takeover. */
  size?: "default" | "wide" | "full";
  /** Accessible name for the close button. Untranslated in the legacy. */
  closeLabel?: string;
  /** Suppresses the header's close button, for content that provides its own. */
  showClose?: boolean;
  className?: string;
}

/**
 * Whether a pointer landed on the control that owns this panel, which is not
 * "outside" it in the sense that matters. The id may name a wrapper, so
 * containment is tested rather than identity.
 */
function controlsThisPanel(
  target: Element | null,
  panel: HTMLElement
): boolean {
  const trigger = target?.closest?.("[aria-controls]");
  const id = trigger?.getAttribute("aria-controls");
  if (!id) return false;

  const controlled = document.getElementById(id);

  return Boolean(
    controlled && (controlled === panel || controlled.contains(panel))
  );
}

const Layer: FunctionComponent<PropsWithChildren<LayerProps>> = ({
  open,
  onClose,
  label,
  closeOnOutsideClick = true,
  side = "left",
  size = "default",
  closeLabel = "Close",
  showClose = true,
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
      if (!panel) return;

      const target = event.target as Element | null;
      if (panel.contains(target)) return;
      if (controlsThisPanel(target, panel)) return;

      onClose();
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
        side === "dock" && styles.dock,
        side === "card" && styles.card,
        size === "wide" && styles.wide,
        size === "full" && styles.full,
        !showClose && styles.flush,
        open && styles.open,
        className
      )}
      aria-label={label}
      aria-hidden={!open}
      // Keeps the closed panel out of the tab order and the a11y tree while
      // leaving it mounted so the transition can play.
      inert={!open}
    >
      {showClose && (
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
      )}
      <div className={styles.body}>{children}</div>
    </section>
  );
};

export default Layer;
