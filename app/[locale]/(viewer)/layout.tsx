import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { getPlanetOrbits } from "@/lib/api/hasura";
import { getSolarEntries, getCategories } from "@/lib/api/craft";
import { isLocale } from "@/lib/i18n/settings";
import { SharedExplorer } from "@/components/organisms/Explorer/SharedExplorer";

/**
 * Home, Explorer, and Guided Experiences share one live renderer, catalog,
 * and simulation.
 */
export default async function ViewerLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [orbits, entries, categories] = await Promise.allSettled([
    getPlanetOrbits(),
    getSolarEntries(locale),
    getCategories(locale),
  ]);
  return (
    <Suspense>
      <SharedExplorer
        initial={orbits.status === "fulfilled" ? orbits.value : []}
        entries={entries.status === "fulfilled" ? entries.value : []}
        categoryEntries={
          categories.status === "fulfilled" ? categories.value : []
        }
        contentError={entries.status === "rejected"}
      >
        {children}
      </SharedExplorer>
    </Suspense>
  );
}
