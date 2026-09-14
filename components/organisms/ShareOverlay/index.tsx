"use client";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/atoms/Icon";
import { ShareControls } from "@/components/molecules/ShareControls";
import styles from "./styles.module.css";

export function ShareOverlay({
  onClose,
  getCanvas,
}: {
  onClose: () => void;
  getCanvas: () => HTMLCanvasElement | null | undefined;
}) {
  const { t } = useTranslation();
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    panel.current?.focus();
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <div className={styles.overlay}>
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-labelledby="share-title"
        className={styles.dialog}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <h2 id="share-title">{t("share.title")}</h2>
        <button
          className={styles.close}
          onClick={onClose}
          aria-label={t("ui.close")}
        >
          <Icon name="close" />
        </button>
        <ShareControls getCanvas={getCanvas} />
      </div>
    </div>
  );
}
