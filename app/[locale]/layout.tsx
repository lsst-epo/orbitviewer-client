// Vendor base styles first, project styles after: both set a `body`
// font-family in a plain rule, so whichever sheet comes last wins. The wrong
// way round renders the whole app in Helvetica -- see styles/README.md.
import "@rubin-epo/epo-react-lib/styles.css";
import "@/styles/globals.css";
import { FunctionComponent, PropsWithChildren } from "react";
import { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { env } from "@/env";
import { routing } from "@/lib/i18n/routing";
import { languages } from "@/lib/i18n/settings";
import { sourceSans3 } from "@/lib/fonts";
import { getGlobals } from "@/lib/api/craft";
import { GLOBALS } from "@/lib/static/globals";
import StyledComponentsRegistry from "@rubin-epo/epo-react-lib/StyledComponentsRegistry";
import I18NextClientProvider from "@/contexts/i18next";
import DebugViewport from "@/components/atoms/DebugViewport";

interface RootProps {
  params: Promise<{ locale: string }>;
}

export const generateStaticParams = () =>
  languages.map((locale) => ({ locale }));

export async function generateMetadata({
  params,
}: RootProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  const globals = await getGlobals({ locale });

  const title = globals?.seoTitle || GLOBALS.title;
  const description = globals?.seoDescription || GLOBALS.description;

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    metadataBase: new URL(env.ROOT_DOMAIN),
    alternates: { canonical: "./" },
    openGraph: {
      siteName: globals?.seoSiteName ?? GLOBALS.title,
      description,
      locale,
      images: [`${GLOBALS.og.basePath}${GLOBALS.og.default}`],
    },
    icons: {
      icon: [
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
    manifest: "/site.webmanifest",
  };
}

export const generateViewport = (): Viewport => ({
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  // The explorer is a full-viewport WebGL canvas; zooming the page fights
  // the scene's own pinch-to-zoom handling.
  maximumScale: 1,
});

const RootLayout: FunctionComponent<PropsWithChildren<RootProps>> = async ({
  children,
  params,
}) => {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale} className={sourceSans3.variable}>
      <body>
        {/* Messages are deliberately empty: next-intl does locale routing
            only here, and all copy comes from i18next. Without the provider
            the navigation helpers throw "No intl context found". */}
        <NextIntlClientProvider locale={locale} messages={{}}>
          {/* The registry is the library's own, so it uses the library's
            styled-components instance. Do NOT add styled-components as a
            dependency of ours -- two copies and the styles stop resolving. */}
          <StyledComponentsRegistry>
            <I18NextClientProvider locale={locale}>
              {children}
              <DebugViewport />
            </I18NextClientProvider>
          </StyledComponentsRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default RootLayout;
