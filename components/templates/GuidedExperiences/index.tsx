import type { FunctionComponent } from "react";
import { serverTranslation } from "@/lib/i18n/server";
import type { TourSummary } from "@/lib/tours";
import ContentHeader from "@/components/molecules/ContentHeader";
import ToursList from "./ToursList";
import styles from "./styles.module.css";

const GuidedExperiences: FunctionComponent<{
  locale: string;
  tours: Array<TourSummary>;
}> = async ({ locale, tours }) => {
  const { t } = await serverTranslation(locale, "translation");

  return (
    <div className={styles.page}>
      <ContentHeader locale={locale} />

      <main className={styles.guides}>
        <div className={styles.heading}>
          <h1 className={styles.title}>{t("guides.index.title")}</h1>
          <p className={styles.subtitle}>{t("guides.index.subtitle")}</p>
        </div>

        <ToursList locale={locale} tours={tours} />
      </main>
    </div>
  );
};

export default GuidedExperiences;
