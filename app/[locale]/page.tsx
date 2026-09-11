import { FunctionComponent } from "react";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { serverTranslation } from "@/lib/i18n/server";
import { getPages } from "@/lib/api/craft";
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
  const { t } = await serverTranslation(locale, "translation");

  return {
    title: t("splash.title", { defaultValue: "Orbitviewer" }),
  };
}

const SplashPage: FunctionComponent<SplashPageProps> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const pages = await getPages({ locale });
  const landing = pages.find((page) => page?.slug === "landing");

  return <Splash locale={locale} landing={landing} />;
};

export default SplashPage;
