"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { ShareControls } from "@/components/molecules/ShareControls";
import { Button } from "@/components/atoms/Button";
import styles from "./share.module.css";

const subscribe = () => () => {};
const client = () => true;
const server = () => false;

/** Keep sharing in the scene context, outside the inert homepage background. */
export function LandingShare() {
  const { t } = useTranslation();
  const dialog = useRef<HTMLDialogElement>(null);
  const mounted = useSyncExternalStore(subscribe, client, server);
  useEffect(() => {
    const share = () => dialog.current?.showModal();
    window.addEventListener("orbitviewer-share", share);
    return () => window.removeEventListener("orbitviewer-share", share);
  }, []);
  if (!mounted) return null;
  return createPortal(
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="homepage-share-title"
    >
      <div className={styles.heading}>
        <h2 id="homepage-share-title">{t("ui.share")}</h2>
        <Button
          onClick={() => dialog.current?.close()}
          aria-label={t("ui.close")}
        >
          ×
        </Button>
      </div>
      <ShareControls getCanvas={() => document.querySelector("main canvas")} />
    </dialog>,
    document.body,
  );
}
