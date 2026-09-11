import { notFound } from "next/navigation";
import { getTours } from "@/lib/api/craft";
import { isLocale } from "@/lib/i18n/settings";
import { TourGallery } from "@/components/organisms/TourGallery";
export default async function GuidedExperiences({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <TourGallery tours={await getTours(locale)} />;
}
