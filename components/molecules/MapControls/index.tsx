"use client";

import { useEffect, useState, type FunctionComponent } from "react";
import useClientTranslation from "@/lib/i18n/client";
import { useSceneControls, type ZoomDirection } from "@/contexts/SceneControls";
import Icon, { type IconName } from "@/components/atoms/Icon";
import styles from "./styles.module.css";

const ZoomButton: FunctionComponent<{
  icon: IconName;
  label: string;
  direction: Exclude<ZoomDirection, 0>;
}> = ({ icon, label, direction }) => {
  const { setZoom } = useSceneControls();

  useEffect(() => () => setZoom(0), [setZoom]);

  return (
    <button
      type="button"
      className={styles.button}
      aria-label={label}
      onPointerDown={(event) => {
        setZoom(direction);

        /* Capture so a pointer that slides off the button still reports its
           release here, rather than leaving the camera travelling. */
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerUp={() => setZoom(0)}
      onPointerCancel={() => setZoom(0)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") setZoom(direction);
      }}
      onKeyUp={() => setZoom(0)}
      onBlur={() => setZoom(0)}
    >
      <Icon name={icon} aria-hidden />
    </button>
  );
};

const MapControls: FunctionComponent<{ locale: string }> = ({ locale }) => {
  const { t } = useClientTranslation(locale);
  const { recenter } = useSceneControls();
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    sync();

    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => undefined);
  };

  return (
    <div
      className={styles.controls}
      role="group"
      aria-label={t("mapcontrols.aria")}
      data-wizard-step="mapcontrols"
    >
      <button
        type="button"
        className={styles.button}
        aria-label={t("mapcontrols.recenter")}
        onClick={recenter}
      >
        <Icon name="recenter" aria-hidden />
      </button>

      <ZoomButton
        icon="zoomIn"
        label={t("mapcontrols.zoom_in")}
        direction={-1}
      />
      <ZoomButton
        icon="zoomOut"
        label={t("mapcontrols.zoom_out")}
        direction={1}
      />

      <button
        type="button"
        className={styles.button}
        aria-label={t("navigation.fullscreen")}
        aria-pressed={fullscreen}
        onClick={toggleFullscreen}
      >
        <Icon name={fullscreen ? "fullscreenOff" : "fullscreen"} aria-hidden />
      </button>
    </div>
  );
};

export default MapControls;
