"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useExplorer } from "@/contexts/ExplorerProvider";
import { dateToMjd, mjdToDate } from "@/lib/solar/orbits";
import { Icon } from "@/components/atoms/Icon";
import styles from "./styles.module.css";

export function TimeControls() {
  const { t } = useTranslation();
  const { mjd, setMjd, speed, setSpeed, playing, setPlaying } = useExplorer();
  const [collapsed, setCollapsed] = useState(false);
  const todayMjd = dateToMjd(new Date());
  const isLive = playing && speed === 0 && Math.abs(mjd - todayMjd) < 0.02;
  const unit =
    Math.abs(speed) === 1 ? t("timemachine.hour") : t("timemachine.hours");
  const speedLabel = speed === 0 ? t("timemachine.real_time") : `${speed} ${unit}`;
  const thumbPct = ((speed + 1000) / 2000) * 100;

  return (
    <section
      className={styles.controls}
      data-collapsed={collapsed}
      aria-label={t("timemachine.aria")}
    >
      <div className={styles.head}>
        <div className={styles.heading}>
          <button
            type="button"
            className={styles.play}
            data-playing={playing}
            aria-label={playing ? t("ui.pause") : t("ui.play")}
            onClick={() => setPlaying(!playing)}
          >
            <Icon name={playing ? "pause" : "play"} />
            <span className={styles.ring} aria-hidden="true" />
          </button>
          <label className={styles.date}>
            <span className="visually-hidden">{t("ui.date")}</span>
            <input
              type="date"
              min="1900-01-01"
              max="2100-01-01"
              value={mjdToDate(mjd).toISOString().slice(0, 10)}
              onChange={(event) => {
                const date = new Date(`${event.target.value}T12:00:00Z`);
                if (Number.isFinite(date.getTime())) setMjd(dateToMjd(date));
              }}
            />
          </label>
          <button
            type="button"
            className={styles.live}
            data-active={isLive}
            onClick={() => {
              setMjd(dateToMjd(new Date()));
              setSpeed(0);
              setPlaying(true);
            }}
          >
            {t("ui.today")}
          </button>
        </div>
        <div className={styles.toggle}>
          <button
            type="button"
            className={styles.collapse}
            aria-expanded={!collapsed}
            aria-label={t("timemachine.aria_toggle")}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed && <span>{speedLabel}</span>}
            <Icon name="chevron-down" />
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className={styles.body}>
          <div className={styles.slider}>
            <label className="visually-hidden" htmlFor="timemachine-speed">
              {t("ui.speed")}
            </label>
            <div className={styles.trackWrap}>
              <span className={styles.track} aria-hidden="true" />
              <input
                id="timemachine-speed"
                type="range"
                min="-1000"
                max="1000"
                step="1"
                value={speed}
                onChange={(event) => {
                  setSpeed(Number(event.target.value));
                  setPlaying(true);
                }}
              />
              {speed !== 0 && (
                <output
                  className={styles.tooltip}
                  style={{ left: `${thumbPct}%` }}
                >
                  {speedLabel}
                </output>
              )}
            </div>
            <div className={styles.labels}>
              <span>-1000 {t("timemachine.hours")}</span>
              <span>1000 {t("timemachine.hours")}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
