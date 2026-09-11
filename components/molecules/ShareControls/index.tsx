"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useExplorer } from "@/contexts/ExplorerProvider";
import { sharedViewUrl } from "@/lib/solar/view";
import { CmsImage } from "@/components/atoms/CmsImage";
import { Button } from "@/components/atoms/Button";
import styles from "./styles.module.css";
const sizes = {
  horizontal: [1920, 1080, "h"],
  vertical: [1080, 1920, "v"],
  square: [1080, 1080, "s"],
} as const;
export function ShareControls({
  getCanvas,
}: {
  getCanvas: () => HTMLCanvasElement | null | undefined;
}) {
  const { t } = useTranslation();
  const { mjd, cameraViewRef } = useExplorer();
  const [copied, setCopied] = useState(false);
  const [ratio, setRatio] = useState<keyof typeof sizes>("horizontal");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [captureUrl, setCaptureUrl] = useState<string>();
  useEffect(
    () => () => {
      if (captureUrl) URL.revokeObjectURL(captureUrl);
    },
    [captureUrl],
  );
  async function capture() {
    const source = getCanvas();
    if (!source) return;
    setBusy(true);
    setError(false);
    try {
      const [width, height, template] = sizes[ratio];
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      const scale = Math.max(width / source.width, height / source.height);
      ctx.drawImage(
        source,
        (width - source.width * scale) / 2,
        (height - source.height * scale) / 2,
        source.width * scale,
        source.height * scale,
      );
      const overlay = new Image();
      overlay.src = `/social/${template}.png`;
      await overlay.decode();
      ctx.drawImage(overlay, 0, 0, width, height);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value ? resolve(value) : reject(new Error("Capture unavailable")),
          "image/png",
        ),
      );
      setCaptureUrl(URL.createObjectURL(blob));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={styles.controls}>
      <Button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(
              sharedViewUrl(window.location.href, mjd, cameraViewRef.current),
            );
            setCopied(true);
          } catch {
            setError(true);
          }
        }}
      >
        {copied ? t("ui.copied") : t("ui.copy")}
      </Button>
      <label>
        {t("share.tabs.screen_capture")}
        <select
          value={ratio}
          onChange={(event) =>
            setRatio(event.target.value as keyof typeof sizes)
          }
        >
          {(Object.keys(sizes) as (keyof typeof sizes)[]).map((value) => (
            <option key={value} value={value}>
              {t(`share.aspect_ratio.${value}`)}
            </option>
          ))}
        </select>
      </label>
      <Button disabled={busy} onClick={() => void capture()}>
        {busy ? t("share.generating") : t("ui.capture")}
      </Button>
      {captureUrl && (
        <>
          <CmsImage src={captureUrl} alt={t("share.tabs.screen_capture")} />
          <a href={captureUrl} download={`orbitviewer-${ratio}.png`}>
            {t("share.download")}
          </a>
        </>
      )}
      {error && <p role="alert">{t("ui.captureError")}</p>}
    </div>
  );
}
