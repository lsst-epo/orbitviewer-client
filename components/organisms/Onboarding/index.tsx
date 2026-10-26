"use client";

import { useEffect, useId, useState, type FunctionComponent } from "react";
import clsx from "clsx/lite";
import { Link } from "@/lib/i18n/navigation";
import useClientTranslation from "@/lib/i18n/client";
import { useSolarData } from "@/contexts/SolarData";
import { useBenchmark } from "@/contexts/Benchmark";
import { OFFERED_QUALITIES } from "@/lib/solar/benchmark";
import { MPC_DATASET_BYTES, type SimQuality } from "@/lib/solar/quality";
import { difficultyKey, type TourSummary } from "@/lib/tours";
import TourCard from "@/components/molecules/TourCard";
import styles from "./styles.module.css";

const MEGABYTE = 1024 * 1024;

export interface OnboardingProps {
  locale: string;
  /** Featured tours, at most three, as the legacy's second slide showed. */
  tours: Array<TourSummary>;
  onDismiss: () => void;
}

const Onboarding: FunctionComponent<OnboardingProps> = ({
  locale,
  tours,
  onDismiss,
}) => {
  const { t } = useClientTranslation(locale);
  const { quality, setQuality } = useSolarData();
  const { result, start } = useBenchmark();
  const headingId = useId();

  const [step, setStep] = useState<"quality" | "tours">("quality");

  useEffect(() => start(), [start]);

  const choose = (next: SimQuality) => {
    setQuality(next);
    setStep("tours");
  };

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
    >
      <div className={styles.panel}>
        {step === "quality" ? (
          <>
            <h2 className={styles.title} id={headingId}>
              {t("onboarding.exploration.title")}
            </h2>

            <ul className={styles.tiers}>
              {OFFERED_QUALITIES.map((tier) => {
                const recommended = result?.quality === tier;

                return (
                  <li key={tier} className={styles.tier}>
                    <div
                      className={clsx(
                        styles.card,
                        recommended && styles.cardRecommended
                      )}
                    >
                      {recommended && (
                        <p className={styles.ribbon}>{t("core.recommended")}</p>
                      )}

                      <p className={styles.device}>
                        {t(`exploration.${tier}.name`)}
                      </p>
                      <h3 className={styles.tierTitle}>
                        {t(`exploration.${tier}.title`)}
                      </h3>
                      <p className={styles.description}>
                        {t(`exploration.${tier}.description`)}
                      </p>

                      <p className={styles.meta}>
                        {Number(
                          t(`exploration.${tier}.objects`)
                        ).toLocaleString(locale)}{" "}
                        {t("core.objects")}
                        {" · "}
                        {Math.round(MPC_DATASET_BYTES[tier] / MEGABYTE)} MB
                      </p>

                      <button
                        type="button"
                        className={clsx(
                          styles.launch,
                          recommended && styles.launchRecommended
                        )}
                        onClick={() => choose(tier)}
                        aria-current={tier === quality ? "true" : undefined}
                      >
                        {t("onboarding.exploration.action")}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className={styles.footnote}>
              {t("onboarding.exploration.info")}
            </p>
          </>
        ) : (
          <>
            <h2 className={styles.title} id={headingId}>
              {t("onboarding.expedition.title")}
            </h2>
            <p className={styles.subtitle}>
              {t("onboarding.expedition.subtitle")}
            </p>

            {tours.length > 0 && (
              <ul className={styles.tours}>
                {tours.map((tour) => (
                  <li key={tour.slug}>
                    <TourCard
                      tour={tour}
                      labels={{
                        difficulty: t(difficultyKey(tour.complexity)),
                        duration: t("guides.index.minutes", {
                          count: tour.duration ?? 0,
                        }),
                        recommended: t("core.recommended"),
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}

            <div className={styles.actions}>
              <Link className={styles.secondary} href="/guided-experiences">
                {t("onboarding.expedition.see_all")}
              </Link>
              <button
                type="button"
                className={styles.primary}
                onClick={onDismiss}
              >
                {t("onboarding.expedition.skip")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
