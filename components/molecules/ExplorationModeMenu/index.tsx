"use client";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/atoms/Icon";
import styles from "./styles.module.css";

export const explorationModes = ["low", "medium", "high", "ultra"] as const;
export type ExplorationMode = (typeof explorationModes)[number];

export function ExplorationModeMenu({
  value,
  onChange,
  onBack,
}: {
  value: string;
  onChange: (mode: ExplorationMode) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  return (
    <section aria-label={t("navigation.exploration")}>
      <header className={styles.heading}>
        <button onClick={onBack} aria-label={t("navigation.back")}>
          <Icon name="arrow-left" />
        </button>
        <h3>{t("navigation.exploration")}</h3>
      </header>
      <div
        className={styles.options}
        role="radiogroup"
        aria-label={t("navigation.exploration")}
      >
        {explorationModes.map((mode) => (
          <label key={mode} className={styles.option}>
            <input
              type="radio"
              name="exploration-mode"
              value={mode}
              checked={value === mode}
              onChange={() => onChange(mode)}
            />
            <span className={styles.row}>
              <span className={styles.text}>
                <span className={styles.title}>
                  {t(`exploration.${mode}.title`)}
                </span>
                <span className={styles.details}>
                  {t(`exploration.${mode}.name`)}
                  <br />
                  {t(`exploration.${mode}.objects`)} {t("core.objects")}
                </span>
              </span>
              <span className={styles.check}>
                <Icon name="check" />
              </span>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
