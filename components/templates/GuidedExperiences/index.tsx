import type { FunctionComponent } from "react";
import { serverTranslation } from "@/lib/i18n/server";
import type { TourSummary } from "@/lib/tours";
import ContentHeader from "@/components/molecules/ContentHeader";
import ToursList from "./ToursList";
import styles from "./styles.module.css";

/**
 * The tour index.
 *
 * Ported from `locale-templates/guided-experiences.njk`, which rendered this
 * as a `.layer` -- a panel over the 3D viewer. It is a page of its own here:
 * browsing a catalogue of tours has nothing to do with the scene, and
 * keeping the canvas alive behind it cost a WebGL context and a running
 * render loop for a list of cards.
 *
 * The scene comes back for the tour itself, which needs it.
 */
const GuidedExperiences: FunctionComponent<{
  locale: string;
  tours: Array<TourSummary>;
}> = async ({ locale, tours }) => {
  const { t } = await serverTranslation(locale, "translation");

  return (
    <>
      <ContentHeader locale={locale} />

      <main className={styles.guides}>
        <div className={styles.heading}>
          <h1 className={styles.title}>{t("guides.index.title")}</h1>
          <p className={styles.subtitle}>{t("guides.index.subtitle")}</p>
        </div>

        <ToursList locale={locale} tours={tours} />
      </main>
    </>
  );
};

export default GuidedExperiences;
