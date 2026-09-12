import { FunctionComponent, Suspense } from "react";
import { Metadata } from "next";
import { z } from "zod";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { languages } from "@/lib/i18n/settings";
import {
  getGuidedExperience,
  getGuidedExperiences,
  getSolarElements,
  getCategories,
  getDataFileUrls,
} from "@/lib/api/craft";
import { getClassificationRanges } from "@/lib/api/hasura";
import {
  getPlanetOrbits,
  getDwarfPlanetOrbits,
} from "@/lib/static/planetOrbits";
import { parseExplorerParams } from "@/lib/explorer/searchParams";
import { slidesOf } from "@/lib/tours";
import ExplorerProvider from "@/contexts/Explorer";
import Explorer from "@/components/templates/Explorer";
import TourPlayer from "@/components/molecules/TourPlayer";

interface TourPageProps {
  params: Promise<{
    locale: string;
    tour: string;
    tourSegments?: Array<string>;
  }>;
  searchParams: Promise<Record<string, string | Array<string> | undefined>>;
}

export async function generateStaticParams() {
  const perLocale = await Promise.all(
    languages.map(async (locale) => {
      const tours = await getGuidedExperiences({ locale });

      return tours.flatMap((entry) =>
        entry && "slug" in entry && entry.slug
          ? [{ locale, tour: entry.slug, tourSegments: [] }]
          : []
      );
    })
  );

  return perLocale.flat();
}

export async function generateMetadata({
  params,
}: TourPageProps): Promise<Metadata> {
  const { locale, tour: slug } = await params;
  setRequestLocale(locale);

  const tour = await getGuidedExperience({ locale, slug });

  if (!tour) return {};

  const preview = tour.tourPreview?.[0];
  const title = tour.seoTitle || tour.title || undefined;
  const description = tour.seoDescription ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: preview?.url
        ? [
            {
              url: preview.url,
              width: preview.width ?? undefined,
              height: preview.height ?? undefined,
              alt: preview.alt ?? undefined,
            },
          ]
        : undefined,
    },
  };
}

/**
 * A tour, played over the scene.
 *
 * The scene is here rather than borrowed from /explorer because a tour needs
 * it: a slide's `closeUp` flies the camera to an object, which is the whole
 * point of a guided experience. It mounts the same `Explorer` template with
 * its chrome replaced -- the legacy closed the time and map controls on
 * entering guided mode for the same reason.
 *
 * The route keeps its optional catch-all from the port plan, but the deck is
 * one linear sequence in Craft, with no intro/tour/summary split to put in a
 * segment. Extra segments are therefore not found rather than silently
 * ignored, so a mistyped URL says so.
 */
const TourPage: FunctionComponent<TourPageProps> = async ({
  params,
  searchParams,
}) => {
  const { locale, tour: slug, tourSegments = [] } = await params;
  setRequestLocale(locale);

  if (tourSegments.length > 0) notFound();

  const query = await searchParams;

  const [
    tour,
    elements,
    categories,
    classificationRanges,
    planets,
    dwarfPlanets,
    dataFileUrls,
  ] = await Promise.all([
    getGuidedExperience({ locale, slug }),
    getSolarElements({ locale }),
    getCategories({ locale }),
    getClassificationRanges(),
    getPlanetOrbits(),
    getDwarfPlanetOrbits(),
    getDataFileUrls(),
  ]);

  if (!tour) notFound();

  const total = slidesOf(tour).length;

  if (total === 0) notFound();

  // Out-of-range or unparseable falls back to the first slide rather than
  // 404ing: the deck can shrink when an editor republishes, and a link to a
  // slide that no longer exists should still open the tour.
  const slide = z.coerce
    .number()
    .int()
    .min(1)
    .max(total)
    .catch(1)
    .parse(Array.isArray(query.slide) ? query.slide[0] : query.slide);

  /**
   * A tour drives the scene, so it starts from a clean view: no filters, no
   * lingering selection, and the clock live. This is the legacy's
   * `goToGuidedExperienceMode`, which reset the filters and called `goLive`.
   */
  const initialParams = parseExplorerParams({});

  return (
    <ExplorerProvider
      initialParams={initialParams}
      elements={elements}
      categories={categories}
      classificationRanges={classificationRanges}
      planets={planets}
      dwarfPlanets={dwarfPlanets}
      dataFileUrls={dataFileUrls}
    >
      <Suspense fallback={null}>
        <Explorer
          locale={locale}
          overlay={<TourPlayer locale={locale} tour={tour} slide={slide} />}
        />
      </Suspense>
    </ExplorerProvider>
  );
};

export default TourPage;
