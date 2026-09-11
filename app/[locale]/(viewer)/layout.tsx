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

/**
 * Everything inside `(viewer)` is drawn over one live scene, as the legacy
 * drew its splash, its guided experiences and its object pages over a canvas
 * that never unmounted. The group is a routing device only -- it does not
 * appear in any URL -- and exists so React can keep that canvas, and the
 * orbital data behind it, mounted across these four routes.
 *
 * The orbital data is fetched here rather than per page for the same reason:
 * one request, shared. The MPC dataset proper is not in this payload, being
 * far too large; only the URLs the browser fetches it from are. See
 * `components/templates/Viewer`.
 */

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
