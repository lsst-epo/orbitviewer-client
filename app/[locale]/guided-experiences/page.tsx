import { FunctionComponent } from "react";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { serverTranslation } from "@/lib/i18n/server";
import { getGuidedExperiences } from "@/lib/api/craft";
import { Link } from "@/lib/i18n/navigation";

interface GuidedExperiencesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: GuidedExperiencesPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const { t } = await serverTranslation(locale, "translation");

  return { title: t("guides.title", { defaultValue: "Guided Experiences" }) };
}

/**
 * SCAFFOLD: renders the tour list from Craft. The card components and the
 * tour player come in a later phase.
 */
const GuidedExperiencesPage: FunctionComponent<
  GuidedExperiencesPageProps
> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const tours = await getGuidedExperiences({ locale });

  return (
    <main>
      <h1>Guided Experiences</h1>
      <ul>
        {tours.map((tour) =>
          tour && "slug" in tour && tour.slug ? (
            <li key={tour.slug}>
              <Link href={`/guided-experiences/${tour.slug}`}>
                {tour.title}
              </Link>
            </li>
          ) : null
        )}
      </ul>
    </main>
  );
};

export default GuidedExperiencesPage;
