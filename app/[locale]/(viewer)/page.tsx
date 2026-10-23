import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/settings";
import { getPages } from "@/lib/api/craft";
import { Landing } from "@/components/templates/Landing";
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const pages = await getPages(locale).catch(() => []);
  return (
    <Landing
      locale={locale}
      content={pages.find((page) => page.slug === "landing")}
    />
  );
}
