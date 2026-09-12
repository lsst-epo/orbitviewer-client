import { Suspense } from "react";
import { getPlanetOrbits } from "@/lib/api/hasura";
import { LandingBackground } from "@/components/templates/Landing/Background";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/settings";
import { getPages, getCategories } from "@/lib/api/craft";
import { Landing } from "@/components/templates/Landing";
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [pages, orbits, categories] = await Promise.all([
    getPages(locale).catch(() => []),
    getPlanetOrbits().catch(() => []),
    getCategories(locale).catch(() => []),
  ]);
  return (
    <Landing
      locale={locale}
      background={
        <Suspense>
          <LandingBackground initial={orbits} categories={categories} />
        </Suspense>
      }
      content={pages.find((page) => page.slug === "landing")}
    />
  );
}
