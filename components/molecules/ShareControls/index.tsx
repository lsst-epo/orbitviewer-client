"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useExplorer } from "@/contexts/ExplorerProvider";
import { sharedViewUrl } from "@/lib/solar/view";
import { Icon } from "@/components/atoms/Icon";
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
  const [tab, setTab] = useState("link");
  const [openedMjd] = useState(mjd);
  const [url, setUrl] = useState("");
  useEffect(() => {
    // Snapshot the external camera and browser location when sharing opens.
    setUrl(
      sharedViewUrl(window.location.href, openedMjd, cameraViewRef.current),
    );
  }, [openedMjd, cameraViewRef]);
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
      <div
        className={styles.tabs}
        role="tablist"
        aria-label={t("share.tabs.aria")}
      >
        {["link", "screen_capture"].map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
          >
            {t(`share.tabs.${value}`)}
          </button>
        ))}
      </div>
      {tab === "link" ? (
        <div className={styles.linkPanel} role="tabpanel">
          <input
            type="url"
            readOnly
            value={url}
            aria-label={t("share.tabs.link")}
            onFocus={(event) => event.target.select()}
          />
          <Button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
              } catch {
                setError(true);
              }
            }}
          >
            <Icon name={copied ? "check" : "download"} />
            {copied ? t("share.tabs.copied") : t("share.tabs.copy")}
          </Button>
          <div className={styles.social}>
            <span>{t("share.tabs.share_on")}</span>
            <div>
              <a
                aria-label="Facebook"
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="facebook" />
              </a>
              <a
                aria-label="X"
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="x" />
              </a>
              <button
                aria-label={t("share.title")}
                onClick={async () => {
                  try {
                    if (navigator.share) await navigator.share({ url });
                    else {
                      await navigator.clipboard.writeText(url);
                      setCopied(true);
                    }
                  } catch (error) {
                    if (!(
                      error instanceof DOMException &&
                      error.name === "AbortError"
                    ))
                      setError(true);
                  }
                }}
              >
                <Icon name="share" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.capturePanel} role="tabpanel">
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
        </div>
      )}
      {error && <p role="alert">{t("ui.captureError")}</p>}
    </div>
  );
}
