import { FunctionComponent, Suspense } from "react";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getSolarElements, getCategories } from "@/lib/api/craft";
import { getClassificationRanges } from "@/lib/api/hasura";
import {
  getPlanetOrbits,
  getDwarfPlanetOrbits,
} from "@/lib/static/planetOrbits";
import { ogImageForElement } from "@/lib/static/globals";
import { parseExplorerParams } from "@/lib/explorer/searchParams";
import ExplorerProvider from "@/contexts/Explorer";
import Explorer from "@/components/templates/Explorer";

interface ExplorerPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | Array<string> | undefined>>;
}

/**
 * Per-object metadata for the detail panel. This is what preserves the OG
 * cards and titles that the legacy /solar-items/<slug>/ pages emitted, now
 * that those URLs 308 to /explorer?object=<slug>.
 */
export async function generateMetadata({
  params,
  searchParams,
}: ExplorerPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const { object } = parseExplorerParams(await searchParams);

  if (!object) return {};

  const elements = await getSolarElements({ locale });
  const element = elements.find(
    (entry) =>
      entry && "elementID" in entry && entry.elementID?.toLowerCase() === object
  );

  if (!element || !("elementID" in element)) return {};

  const description = element.textBody?.plainText?.slice(0, 150);

  return {
    title: element.title ?? undefined,
    description,
    openGraph: {
      title: element.title ?? undefined,
      description,
      images: [ogImageForElement(element.elementID)],
    },
  };
}

const ExplorerPage: FunctionComponent<ExplorerPageProps> = async ({
  params,
  searchParams,
}) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const initialParams = parseExplorerParams(await searchParams);

  // Fetched on the server so the scene has its orbital data in the first
  // payload, rather than the legacy client-side LoadManager waterfall.
  const [elements, categories, classificationRanges, planets, dwarfPlanets] =
    await Promise.all([
      getSolarElements({ locale }),
      getCategories({ locale }),
      getClassificationRanges(),
      getPlanetOrbits(),
      getDwarfPlanetOrbits(),
    ]);

  return (
    <ExplorerProvider
      initialParams={initialParams}
      elements={elements}
      categories={categories}
      classificationRanges={classificationRanges}
      planets={planets}
      dwarfPlanets={dwarfPlanets}
    >
      {/* useSearchParams below this point requires a Suspense boundary, or
          the production build fails with "Missing Suspense boundary". */}
      <Suspense fallback={null}>
        <Explorer locale={locale} />
      </Suspense>
    </ExplorerProvider>
  );
};

export default ExplorerPage;
