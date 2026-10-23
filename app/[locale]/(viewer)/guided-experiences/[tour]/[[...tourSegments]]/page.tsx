import { notFound } from "next/navigation";
import { getTours } from "@/lib/api/craft";
import { isLocale } from "@/lib/i18n/settings";
import { TourPlayer } from "@/components/organisms/TourPlayer";
import { RichText } from "@/components/atoms/RichText";
export default async function TourPage({
  params,
}: {
  params: Promise<{ locale: string; tour: string; tourSegments?: string[] }>;
}) {
  const { locale, tour: slug, tourSegments = [] } = await params;
  if (!isLocale(locale) || tourSegments.length > 1) notFound();
  const step = tourSegments.length ? Number(tourSegments[0]) - 1 : 0;
  if (!Number.isInteger(step) || step < 0) notFound();
  const tours = await getTours(locale);
  const tour = tours.find((item) => item.slug === slug);
  const slide = tour?.flexible[step];
  if (!tour || !slide) notFound();
  return (
    <TourPlayer
      title={tour.title}
      slug={slug}
      step={step}
      total={tour.flexible.length}
      target={slide.closeUp?.[0]?.elementID}
      heroImage={slide.thumbnail ? tour.tourPreview?.[0]?.url : undefined}
      subTitle={slide.subTitle}
      slideTitle={slide.slideTitle}
    >
      <RichText html={slide.slideContent} />
      <RichText html={slide.slideText} />
      {[
        [slide.Link1, slide.link1Text],
        [slide.link2, slide.link2Text],
        [slide.link3, slide.link3Text],
        [slide.link4, slide.link4Text],
      ]
        .filter(([url]) => url && /^https?:\/\//.test(url))
        .map(([url, label]) => (
          <p key={url}>
            <a href={url} target="_blank" rel="noreferrer">
              {label || url}
            </a>
          </p>
        ))}
    </TourPlayer>
  );
}
