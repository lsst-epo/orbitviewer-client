"use client";
import { useTranslation } from "react-i18next";
import { useExplorer } from "@/contexts/ExplorerProvider";
import { dateToMjd, mjdToDate } from "@/lib/solar/orbits";
import { Button } from "@/components/atoms/Button";
import styles from "./styles.module.css";
export function TimeControls() {
  const { t } = useTranslation();
  const { mjd, setMjd, speed, setSpeed } = useExplorer();
  return (
    <section className={styles.controls} aria-label={t("timemachine.aria")}>
      <Button
        aria-label={speed ? t("ui.pause") : t("ui.play")}
        onClick={() => setSpeed(speed ? 0 : 1)}
      >
        {speed ? "Ⅱ" : "▶"}
      </Button>
      <label>
        {t("ui.date")}
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
      <label>
        {t("ui.speed")}
        <input
          type="range"
          min="-30"
          max="30"
          step="1"
          value={speed}
          onChange={(event) => setSpeed(Number(event.target.value))}
        />
        <output>{speed}</output>
      </label>
      <Button
        onClick={() => {
          setMjd(dateToMjd(new Date()));
          setSpeed(0);
        }}
      >
        {t("ui.today")}
      </Button>
    </section>
  );
}
