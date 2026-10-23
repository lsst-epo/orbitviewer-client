"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { useExplorer } from "@/contexts/ExplorerProvider";
import { Icon } from "@/components/atoms/Icon";
import styles from "./styles.module.css";

export function FiltersOverlay({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const {
    discoverer,
    setDiscoverer,
    distanceRange,
    setDistanceRange,
    distanceBounds,
  } = useExplorer();
  const panel = useRef<HTMLElement>(null);
  const [min, max] = distanceBounds;
  const lower = Math.max(min, Math.min(max, distanceRange[0]));
  const upper = Math.max(lower, Math.min(max, distanceRange[1]));
  const span = max - min || 1;
  const decimals = span < 10 ? 2 : span < 100 ? 1 : 0;
  useEffect(() => {
    const previous = document.activeElement;
    panel.current?.focus();
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <section
      ref={panel}
      tabIndex={-1}
      className={styles.overlay}
      aria-labelledby="filters-title"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <header className={styles.mobileHeader}>
        <button onClick={onClose} aria-label={t("ui.close")}>
          <Icon name="close" />
        </button>
      </header>
      <div className={styles.card}>
        <div className={styles.heading}>
          <h2 id="filters-title">{t("filters.title")}</h2>
          <button
            className={styles.reset}
            onClick={() => {
              setDiscoverer("all");
              setDistanceRange([-Infinity, Infinity]);
            }}
          >
            {t("filters.reset")}
          </button>
        </div>
        <div className={styles.body}>
          <fieldset className={styles.field}>
            <legend>{t("filters.discoveries")}</legend>
            <div
              className={styles.toggle}
              role="radiogroup"
              aria-label={t("filters.toggle.aria")}
            >
              {["all", "rubin", "other"].map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="discoverer"
                    value={value}
                    checked={discoverer === value}
                    onChange={() => setDiscoverer(value)}
                  />
                  <span>{t(`filters.toggle.${value}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className={styles.field}>
            <div className={styles.label}>
              <span id="distance-title">{t("filters.distance")}</span>
              <small>{t("filters.au")}</small>
            </div>
            <div
              className={styles.slider}
              style={
                {
                  "--lower": `${((lower - min) / span) * 100}%`,
                  "--upper": `${((upper - min) / span) * 100}%`,
                } as CSSProperties
              }
            >
              <div className={styles.values}>
                <output>{lower.toFixed(decimals)}</output>
                <output>{upper.toFixed(decimals)}</output>
              </div>
              <div className={styles.track} />
              <input
                type="range"
                aria-label={t("filters.minimumDistance")}
                min={min}
                max={max}
                step={span / 100}
                value={lower}
                onChange={(event) =>
                  setDistanceRange([
                    Math.min(Number(event.target.value), upper),
                    distanceRange[1],
                  ])
                }
              />
              <input
                type="range"
                aria-label={t("filters.maximumDistance")}
                min={min}
                max={max}
                step={span / 100}
                value={upper}
                onChange={(event) =>
                  setDistanceRange([
                    distanceRange[0],
                    Math.max(Number(event.target.value), lower),
                  ])
                }
              />
              <div className={styles.extremes}>
                <span>
                  {min.toFixed(decimals)} {t("filters.au")}
                </span>
                <span>
                  {max.toFixed(decimals)} {t("filters.au")}
                </span>
              </div>
            </div>
          </div>
        </div>
        <button className={styles.apply} onClick={onClose}>
          {t("filters.apply")}
        </button>
      </div>
    </section>
  );
}
