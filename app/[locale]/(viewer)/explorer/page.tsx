import { FunctionComponent } from "react";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getSolarElements, getGuidedExperiences } from "@/lib/api/craft";
import { ogImageForElement } from "@/lib/static/globals";
import { parseExplorerParams } from "@/lib/explorer/searchParams";
import { resolveCraftElement } from "@/lib/explorer/resolveObject";
import Explorer from "@/components/templates/Explorer";
import type { TourSummary } from "@/lib/tours";

/** Onboarding offers at most three, as the legacy's second slide did. */
const ONBOARDING_TOURS = 3;

interface ExplorerPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | Array<string> | undefined>>;
}

/**
 * Per-object metadata for the detail panel. This is what preserves the OG
 * cards and titles that the legacy /solar-items/<slug>/ pages emitted, now
 * that those URLs 308 to /explorer?object=<slug>.
 */
export async function generateMetadata({
  params,
  searchParams,
}: ExplorerPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const { object } = parseExplorerParams(await searchParams);

  if (!object) return {};

  const elements = await getSolarElements({ locale });

  // The Craft union includes members without these fields, so narrow with a
  // predicate -- a plain truthiness filter does not change the type.
  type SolarElementEntry = Extract<
    (typeof elements)[number],
    { elementID?: string | null }
  >;

  const element = resolveCraftElement(
    elements.filter(
      (entry): entry is SolarElementEntry =>
        entry !== null && "elementID" in entry
    ),
    object
  );

  if (!element) return {};

  const description = element.textBody?.plainText?.slice(0, 150);

  return {
    title: element.title ?? undefined,
    description,
    openGraph: {
      title: element.title ?? undefined,
      description,
      images: [ogImageForElement(element.elementID)],
    },
  };
}

const ExplorerPage: FunctionComponent<ExplorerPageProps> = async ({
  params,
}) => {
  const { locale } = await params;
  setRequestLocale(locale);

  // The orbital data and the canvas belong to the `(viewer)` layout, which
  // holds them across every route in the group; only what onboarding needs
  // is fetched here.
  const tours = await getGuidedExperiences({ locale });

  const featuredTours = tours
    .filter(
      (entry): entry is TourSummary =>
        entry !== null && "slug" in entry && Boolean(entry.slug)
    )
    .filter((tour) => tour.featuredTour)
    .slice(0, ONBOARDING_TOURS);

  return <Explorer locale={locale} featuredTours={featuredTours} />;
};

export default ExplorerPage;
