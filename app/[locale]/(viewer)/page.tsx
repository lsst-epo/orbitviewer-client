import { FunctionComponent } from "react";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getContentPage, getDataFileUrls } from "@/lib/api/craft";
import { datasetUrlFor, fetchRubinDiscoveryCount } from "@/lib/api/mpcData";
import Splash from "@/components/templates/Splash";

interface SplashPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * The locale root renders the splash -- the landing state that the legacy
 * `index.njk` drew over the viewer via `splash.njk`. Its call to action
 * navigates to /explorer, which now owns the 3D scene.
 */
export async function generateMetadata({
  params,
}: SplashPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const page = await getContentPage({ locale, slug: "landing" });

  if (page?.__typename !== "landing_Entry") return {};

  return {
    title: page.headlineText ?? undefined,
    description: page.eyebrowText ?? undefined,
  };
}

const SplashPage: FunctionComponent<SplashPageProps> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);
  // The count lives in the head of the MPC dataset, which is also where the
  // legacy read it. Any tier's file carries the same figure; the smallest is
  // asked for since only its first 256 bytes are actually read.
  const [page, dataFileUrls] = await Promise.all([
    getContentPage({ locale, slug: "landing" }),
    getDataFileUrls(),
  ]);

  const datasetUrl = datasetUrlFor(dataFileUrls, "low");
  const discoveries = datasetUrl
    ? await fetchRubinDiscoveryCount(datasetUrl)
    : null;

  return (
    <Splash
      locale={locale}
      landing={page?.__typename === "landing_Entry" ? page : undefined}
      discoveries={discoveries}
    />
  );
};

export default SplashPage;
