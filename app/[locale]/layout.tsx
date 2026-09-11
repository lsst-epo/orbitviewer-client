import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { TranslationProvider } from "@/contexts/TranslationProvider";
import { ViewportIndicator } from "@/components/atoms/ViewportIndicator";
import { Header } from "@/components/organisms/Header";
import { isLocale } from "@/lib/i18n/settings";
import { getSiteMetadata } from "@/lib/globals";
import "@/styles/base.css";

const font = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
});
export async function generateMetadata(): Promise<Metadata> {
  const data = await getSiteMetadata();
  return {
    title: { default: data.title, template: `%s | ${data.title}` },
    description: data.description,
    icons: {
      icon: "/favicon/favicon.ico",
      apple: "/favicon/apple-touch-icon.png",
    },
    manifest: "/favicon/site.webmanifest",
    openGraph: {
      title: data.title,
      description: data.description,
      images: ["/images/og/default.webp"],
    },
    metadataBase: new URL(process.env.ROOT_DOMAIN ?? "https://orbitviewer.app"),
  };
}
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  return (
    <html lang={locale} className={font.variable}>
      <body>
        <NextIntlClientProvider locale={locale} messages={{}}>
          <TranslationProvider locale={locale}>
            <Suspense>
              <Header />
            </Suspense>
            {children}
            <ViewportIndicator />
          </TranslationProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
