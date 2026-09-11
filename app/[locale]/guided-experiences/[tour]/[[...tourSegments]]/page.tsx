import { FunctionComponent } from "react";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getGuidedExperiences } from "@/lib/api/craft";

interface TourPageProps {
  params: Promise<{
    locale: string;
    tour: string;
    /** Optional trailing segments: intro | tour | summary | slide index. */
    tourSegments?: Array<string>;
  }>;
}

export async function generateMetadata({
  params,
}: TourPageProps): Promise<Metadata> {
  const { locale, tour: slug } = await params;
  setRequestLocale(locale);
  const tours = await getGuidedExperiences({ locale });
  const tour = tours.find(
    (entry) => entry && "slug" in entry && entry.slug === slug
  );

  return { title: tour?.title ?? undefined };
}

/**
 * SCAFFOLD: resolves the tour and its sub-step from the URL. The slide
 * components (intro / default / fun fact / share) come in a later phase.
 */
const TourPage: FunctionComponent<TourPageProps> = async ({ params }) => {
  const { locale, tour: slug, tourSegments = [] } = await params;
  setRequestLocale(locale);
  const tours = await getGuidedExperiences({ locale });
  const tour = tours.find(
    (entry) => entry && "slug" in entry && entry.slug === slug
  );

  if (!tour) notFound();

  const [step = "intro"] = tourSegments;

  return (
    <main>
      <h1>{tour.title}</h1>
      <p>Step: {step}</p>
    </main>
  );
};

export default TourPage;
