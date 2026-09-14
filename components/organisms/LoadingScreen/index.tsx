"use client";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Artwork } from "./Artwork";
import styles from "./styles.module.css";

const subscribe = () => () => {};
const client = () => true;
const server = () => false;

export function LoadingScreen() {
  const { t } = useTranslation();
  const mounted = useSyncExternalStore(subscribe, client, server);
  const screen = (
    <div className={styles.screen} role="status" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.symbol} aria-hidden="true">
          <Artwork />
        </div>
        <p>{t("core.loading")}</p>
      </div>
    </div>
  );
  // Escape the homepage background's inert subtree and stacking context.
  return mounted ? createPortal(screen, document.body) : screen;
}
