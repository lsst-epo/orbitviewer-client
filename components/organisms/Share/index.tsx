"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FunctionComponent,
} from "react";
import clsx from "clsx/lite";
import useClientTranslation from "@/lib/i18n/client";
import { useExplorer } from "@/contexts/Explorer";
import { useSolarClock } from "@/contexts/SolarClock";
import { useCapture } from "@/contexts/Capture";
import { serializeExplorerParams } from "@/lib/explorer/searchParams";
import {
  SHARE_SIZES,
  composeShareImage,
  shareFilename,
  type ShareLayout,
} from "@/lib/explorer/shareImage";
import Icon from "@/components/atoms/Icon";
import ToggleGroup from "@/components/atoms/ToggleGroup";
import styles from "./styles.module.css";

const COPIED_RESET_MS = 3000;
const LAYOUTS: Array<ShareLayout> = ["horizontal", "vertical", "square"];

export interface ShareProps {
  locale: string;
  open: boolean;
  onClose: () => void;
}

const Share: FunctionComponent<ShareProps> = ({ locale, open, onClose }) => {
  const { t } = useClientTranslation(locale);
  const { params } = useExplorer();
  const { dateRef } = useSolarClock();
  const { capture } = useCapture();

  const titleId = useId();
  const linkTabId = useId();
  const imageTabId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const [tab, setTab] = useState<"link" | "image">("link");
  const [copied, setCopied] = useState(false);
  const [layout, setLayout] = useState<ShareLayout>("horizontal");
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState<HTMLCanvasElement | null>(null);

  /** The shareable URL, resolved when asked rather than held in state. */
  const shareUrl = useCallback(() => {
    const query = serializeExplorerParams({
      ...params,
      date: dateRef.current.toISOString(),
    });

    return `${window.location.origin}${window.location.pathname}${
      query ? `?${query}` : ""
    }`;
  }, [params, dateRef]);

  const [url, setUrl] = useState("");

  useEffect(() => {
    if (open) setUrl(shareUrl());
  }, [open, shareUrl]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  const refreshPreview = useCallback(async () => {
    setBusy(true);
    const snapshot = await capture();

    if (!snapshot) {
      setBusy(false);
      return;
    }

    const composed = await composeShareImage(snapshot, layout);
    setImage(composed);
    setBusy(false);
  }, [capture, layout]);

  useEffect(() => {
    if (open && tab === "image") void refreshPreview();
  }, [open, tab, refreshPreview]);

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas || !image) return;

    canvas.width = image.width;
    canvas.height = image.height;
    // Drawn rather than exported to a data URL: a 1920x1080 PNG string is a
    // few megabytes of JavaScript, and this only has to be looked at.
    canvas.getContext("2d")?.drawImage(image, 0, 0);
  }, [image]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      // Clipboard access can be refused; the field is selectable either way.
    }
  };

  const onDownload = () => {
    if (!image) return;

    image.toBlob((blob) => {
      if (!blob) return;

      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = shareFilename();
      link.click();
      URL.revokeObjectURL(href);
    }, "image/png");
  };

  if (!open) return null;

  return (
    <div className={styles.backdrop} onPointerDown={onClose}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        // The backdrop closes on click; the dialog itself must not.
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className={styles.head}>
          <h2 className={styles.title} id={titleId}>
            {t("share.title")}
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label={t("core.close")}
          >
            <Icon name="close" aria-hidden />
          </button>
        </div>

        <div
          className={styles.tabs}
          role="tablist"
          aria-label={t("share.tabs.aria")}
        >
          <button
            type="button"
            role="tab"
            id={linkTabId}
            className={clsx(styles.tab, tab === "link" && styles.tabActive)}
            aria-selected={tab === "link"}
            tabIndex={tab === "link" ? 0 : -1}
            onClick={() => setTab("link")}
          >
            {t("share.tabs.link")}
          </button>
          <button
            type="button"
            role="tab"
            id={imageTabId}
            className={clsx(styles.tab, tab === "image" && styles.tabActive)}
            aria-selected={tab === "image"}
            tabIndex={tab === "image" ? 0 : -1}
            onClick={() => setTab("image")}
          >
            {t("share.tabs.screen_capture")}
          </button>
        </div>

        {tab === "link" && (
          <div
            className={styles.panel}
            role="tabpanel"
            aria-labelledby={linkTabId}
          >
            <div className={styles.inputGroup}>
              <input
                className={styles.input}
                type="url"
                value={url}
                readOnly
                aria-label={t("share.tabs.link")}
                onFocus={(event) => event.target.select()}
              />
              <button type="button" className={styles.copy} onClick={onCopy}>
                <Icon name={copied ? "check" : "copy"} aria-hidden />
                <span>
                  {copied ? t("share.tabs.copied") : t("share.tabs.copy")}
                </span>
              </button>
            </div>

            <div className={styles.social}>
              <p className={styles.socialLabel}>{t("share.tabs.share_on")}</p>
              <ul className={styles.socialList}>
                <li>
                  <a
                    className={styles.socialLink}
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="Facebook"
                  >
                    <Icon name="facebook" aria-hidden />
                  </a>
                </li>
                <li>
                  <a
                    className={styles.socialLink}
                    href={`https://x.com/intent/tweet?url=${encodeURIComponent(url)}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="X"
                  >
                    <Icon name="x" aria-hidden />
                  </a>
                </li>
                <li>
                  <NativeShare url={url} label={t("share.title")} />
                </li>
              </ul>
            </div>
          </div>
        )}

        {tab === "image" && (
          <div
            className={styles.panel}
            role="tabpanel"
            aria-labelledby={imageTabId}
          >
            <div
              className={styles.preview}
              style={{
                aspectRatio: `${SHARE_SIZES[layout].width} / ${SHARE_SIZES[layout].height}`,
              }}
            >
              <canvas
                ref={previewRef}
                className={styles.previewCanvas}
                aria-label={t("share.tabs.screen_capture")}
                role="img"
              />
            </div>

            <ToggleGroup<ShareLayout>
              label={t("share.tabs.screen_capture")}
              options={LAYOUTS.map((value) => ({
                value,
                label: t(`share.aspect_ratio.${value}`),
              }))}
              value={layout}
              onChange={setLayout}
            />

            <button
              type="button"
              className={styles.download}
              onClick={onDownload}
              disabled={busy || !image}
            >
              <Icon name="download" aria-hidden />
              <span>{busy ? t("share.generating") : t("share.download")}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/** The Web Share button, rendered only where the API exists. */
const NativeShare: FunctionComponent<{ url: string; label: string }> = ({
  url,
  label,
}) => {
  const [supported, setSupported] = useState(false);

  useEffect(() => setSupported(typeof navigator.share === "function"), []);

  if (!supported) return null;

  return (
    <button
      type="button"
      className={styles.socialLink}
      onClick={() => void navigator.share({ url }).catch(() => undefined)}
      aria-label={label}
    >
      <Icon name="share" aria-hidden />
    </button>
  );
};

export default Share;
