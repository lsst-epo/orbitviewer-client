import { FunctionComponent } from "react";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { serverTranslation } from "@/lib/i18n/server";
import { languages } from "@/lib/i18n/settings";
import { getGuidedExperiences } from "@/lib/api/craft";
import type { TourSummary } from "@/lib/tours";
import GuidedExperiences from "@/components/templates/GuidedExperiences";

interface GuidedExperiencesPageProps {
  params: Promise<{ locale: string }>;
}

export const generateStaticParams = () =>
  languages.map((locale) => ({ locale }));

export async function generateMetadata({
  params,
}: GuidedExperiencesPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const { t } = await serverTranslation(locale, "translation");

  return {
    title: t("guides.index.title"),
    description: t("guides.index.subtitle"),
  };
}

const GuidedExperiencesPage: FunctionComponent<
  GuidedExperiencesPageProps
> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const entries = await getGuidedExperiences({ locale });
  const tours = entries.filter(
    (entry): entry is TourSummary =>
      entry !== null && "slug" in entry && Boolean(entry.slug)
  );

  return <GuidedExperiences locale={locale} tours={tours} />;
};

export default GuidedExperiencesPage;
