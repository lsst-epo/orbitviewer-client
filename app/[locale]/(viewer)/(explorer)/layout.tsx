import type { FunctionComponent, PropsWithChildren } from "react";
import { setRequestLocale } from "next-intl/server";
import { getGuidedExperiences } from "@/lib/api/craft";
import Explorer from "@/components/templates/Explorer";
import type { TourSummary } from "@/lib/tours";

/** Onboarding offers at most three, as the legacy's second slide did. */
const ONBOARDING_TOURS = 3;

interface ExplorerLayoutProps {
  params: Promise<{ locale: string }>;
}

const ExplorerLayout: FunctionComponent<
  PropsWithChildren<ExplorerLayoutProps>
> = async ({ children, params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const tours = await getGuidedExperiences({ locale });

  const featuredTours = tours
    .filter(
      (entry): entry is TourSummary =>
        entry !== null && "slug" in entry && Boolean(entry.slug)
    )
    .filter((tour) => tour.featuredTour)
    .slice(0, ONBOARDING_TOURS);

  return (
    <Explorer locale={locale} featuredTours={featuredTours}>
      {children}
    </Explorer>
  );
};

export default ExplorerLayout;
