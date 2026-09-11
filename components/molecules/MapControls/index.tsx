"use client";

import { useEffect, useState, type FunctionComponent } from "react";
import useClientTranslation from "@/lib/i18n/client";
import { useSceneControls, type ZoomDirection } from "@/contexts/SceneControls";
import Icon, { type IconName } from "@/components/atoms/Icon";
import styles from "./styles.module.css";

/**
 * Recentre, zoom and fullscreen, over the scene.
 *
 * Ported from `layers/MapControls.ts` and `partials/mapcontrols.njk`.
 *
 * Zoom is held rather than stepped, as it was there: the legacy's
 * `attachUpDownActions` set `controls.zoom` on press and cleared it on
 * release, and the camera moved a little every frame in between. It bound
 * six listeners per button to do that; a pointer capture covers the same
 * ground, including the case the legacy handled with `mouseleave` -- dragging
 * off the button while still held.
 */

const ZoomButton: FunctionComponent<{
  icon: IconName;
  label: string;
  direction: Exclude<ZoomDirection, 0>;
}> = ({ icon, label, direction }) => {
  const { setZoom } = useSceneControls();

  /**
   * Released on pointerup, on cancel, and on unmount. Zoom is a held state,
   * so anything that ends the press without one of these would leave the
   * camera travelling on its own.
   */
  useEffect(() => () => setZoom(0), [setZoom]);

  return (
    <button
      type="button"
      className={styles.button}
      aria-label={label}
      onPointerDown={(event) => {
        setZoom(direction);

        // Capture so a pointer that slides off the button still reports its
        // release here -- the case the legacy covered with a `mouseleave`
        // listener. Best-effort: it throws for a pointer id the browser does
        // not recognise, and zooming must not depend on it.
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Released by pointerup on the document instead.
        }
      }}
      onPointerUp={() => setZoom(0)}
      onPointerCancel={() => setZoom(0)}
      // Keyboard sends no pointer events, so a press there is one step.
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

  // Read from the document, not tracked locally: Escape leaves fullscreen
  // without firing any click of ours.
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

      {/* One button that reports its state, rather than the legacy's pair of
          buttons with one permanently `aria-hidden`. */}
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
