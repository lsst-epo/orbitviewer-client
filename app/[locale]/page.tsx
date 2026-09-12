import { FunctionComponent } from "react";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getContentPage } from "@/lib/api/craft";
import { getRubinDiscoveryCount } from "@/lib/api/hasura";
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
  const [page, discoveries] = await Promise.all([
    getContentPage({ locale, slug: "landing" }),
    getRubinDiscoveryCount(),
  ]);

  return (
    <Splash
      locale={locale}
      landing={page?.__typename === "landing_Entry" ? page : undefined}
      discoveries={discoveries}
    />
  );
};

export default SplashPage;
