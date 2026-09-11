import { notFound } from "next/navigation";
import { getPages } from "@/lib/api/craft";
import { isLocale } from "@/lib/i18n/settings";
import { ContentPage } from "@/components/templates/ContentPage";
export default async function CMSPage({
  params,
}: {
  params: Promise<{ locale: string; uriSegments: string[] }>;
}) {
  const { locale, uriSegments } = await params;
  if (!isLocale(locale)) notFound();
  const slug = uriSegments.join("/");
  const pages = await getPages(locale);
  const page = pages.find(
    (entry) =>
      entry.slug === slug ||
      (slug === "how-to-use" &&
        ["how_to_use", "how-to-use"].includes(entry.slug)),
  );
  if (!page) notFound();
  return <ContentPage page={page} />;
}
