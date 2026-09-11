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
  // The explorer is a full-viewport WebGL canvas; zooming the page fights
  // the scene's own pinch-to-zoom handling.
  width: "device-width",
  initialScale: 1,
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

  // Establishes the next-intl request context for everything below. Without
  // it, the locale-aware navigation helpers (Link, getPathname) throw
  // "No intl context found" when rendered from a Server Component.
  setRequestLocale(locale);

  return (
    <html lang={locale} className={sourceSans3.variable}>
      <body>
        {/* Supplies the locale to next-intl's client-side navigation helpers
            (Link, useRouter, usePathname). Without it those throw
            "No intl context found" the moment they render.

            Messages are intentionally empty: next-intl is used here only for
            locale routing. All copy is resolved through i18next, matching the
            Skyviewer split, and the provider otherwise tries to load its own
            message catalogue and fails. */}
        <NextIntlClientProvider locale={locale} messages={{}}>
          <I18NextClientProvider locale={locale}>
            {children}
            <DebugViewport />
          </I18NextClientProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default RootLayout;
