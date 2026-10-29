import type { FunctionComponent, PropsWithChildren } from "react";
import { setRequestLocale } from "next-intl/server";
import {
  getSolarElements,
  getCategories,
  getDataFileUrls,
} from "@/lib/api/craft";
import { getClassificationRanges } from "@/lib/api/hasura";
import {
  getPlanetOrbits,
  getDwarfPlanetOrbits,
} from "@/lib/static/planetOrbits";
import Viewer from "@/components/templates/Viewer";

interface ViewerLayoutProps {
  params: Promise<{ locale: string }>;
}

const ViewerLayout: FunctionComponent<
  PropsWithChildren<ViewerLayoutProps>
> = async ({ children, params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const [
    elements,
    categories,
    classificationRanges,
    planets,
    dwarfPlanets,
    dataFileUrls,
  ] = await Promise.all([
    getSolarElements({ locale }),
    getCategories({ locale }),
    getClassificationRanges(),
    getPlanetOrbits(),
    getDwarfPlanetOrbits(),
    getDataFileUrls(),
  ]);

  return (
    <Viewer
      locale={locale}
      elements={elements}
      categories={categories}
      classificationRanges={classificationRanges}
      planets={planets}
      dwarfPlanets={dwarfPlanets}
      dataFileUrls={dataFileUrls}
    >
      {children}
    </Viewer>
  );
};

export default ViewerLayout;
