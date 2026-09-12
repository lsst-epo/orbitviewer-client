import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { getSolarEntries, getCategories } from "@/lib/api/craft";
import { getPlanetOrbits } from "@/lib/api/hasura";
import { isLocale } from "@/lib/i18n/settings";
import { Explorer } from "@/components/organisms/Explorer";

/** Keep the scene and camera mounted while the tour's step route changes. */
export default async function TourLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; tour: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [orbits, entries, categories] = await Promise.all([
    getPlanetOrbits(),
    getSolarEntries(locale),
    getCategories(locale),
  ]);
  return (
    <Suspense>
      <Explorer initial={orbits} entries={entries} categoryEntries={categories}>
        {children}
      </Explorer>
    </Suspense>
  );
}
