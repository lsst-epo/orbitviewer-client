import { FunctionComponent } from "react";
import { Metadata } from "next";
import { z } from "zod";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { languages } from "@/lib/i18n/settings";
import { getGuidedExperience, getGuidedExperiences } from "@/lib/api/craft";
import { slidesOf } from "@/lib/tours";
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
 * Renders only the overlay: the `Explorer` template is mounted by the group
 * layout, which this route shares with /explorer -- see the README.
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

  const tour = await getGuidedExperience({ locale, slug });

  if (!tour) notFound();

  const total = slidesOf(tour).length;

  if (total === 0) notFound();

  const slide = z.coerce
    .number()
    .int()
    .min(1)
    .max(total)
    .catch(1)
    .parse(Array.isArray(query.slide) ? query.slide[0] : query.slide);

  return <TourPlayer locale={locale} tour={tour} slide={slide} />;
};

export default TourPage;
