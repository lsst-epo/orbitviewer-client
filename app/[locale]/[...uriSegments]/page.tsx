import { FunctionComponent } from "react";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { languages } from "@/lib/i18n/settings";
import { getContentPage, getPages } from "@/lib/api/craft";
import About from "@/components/templates/About";
import HowToUse from "@/components/templates/HowToUse";

interface UriSegmentsPageProps {
  params: Promise<{ locale: string; uriSegments: Array<string> }>;
}

/**
 * Catch-all for the Craft-backed content pages: About and How to Use.
 *
 * The Craft `pages` section returns About, How to Use and Landing as one
 * union, keyed by slug -- so the URI is matched straight against the entry
 * slug. Landing is excluded here: it renders at the locale root instead.
 */
const RESERVED_SLUGS = new Set(["landing"]);

/**
 * Prerenders the content pages, which change only when an editor publishes.
 * They are revalidated by tag from /api/revalidate, so this costs nothing in
 * freshness. Anything not listed here still renders on demand.
 */
export async function generateStaticParams() {
  const pages = await Promise.all(
    languages.map(async (locale) => {
      const entries = await getPages({ locale });

      return entries.flatMap((entry) =>
        entry?.slug && !RESERVED_SLUGS.has(entry.slug)
          ? [{ locale, uriSegments: entry.slug.split("/") }]
          : []
      );
    })
  );

  return pages.flat();
}

export async function generateMetadata({
  params,
}: UriSegmentsPageProps): Promise<Metadata> {
  const { locale, uriSegments } = await params;
  setRequestLocale(locale);

  const page = await getContentPage({ locale, slug: uriSegments.join("/") });

  if (!page) return {};

  const description =
    page.__typename === "about_Entry"
      ? (page.headerBody?.plainText ?? undefined)
      : page.__typename === "howToUse_Entry"
        ? (page.headerText ?? undefined)
        : undefined;

  return { title: page.title ?? undefined, description };
}

const UriSegmentsPage: FunctionComponent<UriSegmentsPageProps> = async ({
  params,
}) => {
  const { locale, uriSegments } = await params;
  setRequestLocale(locale);

  const uri = uriSegments.join("/");

  if (RESERVED_SLUGS.has(uri)) notFound();

  const page = await getContentPage({ locale, slug: uri });

  // Narrowed on `__typename`: the page types share no field beyond the
  // interface, so it is the only thing that identifies which one this is.
  switch (page?.__typename) {
    case "about_Entry":
      return <About locale={locale} page={page} />;
    case "howToUse_Entry":
      return <HowToUse locale={locale} page={page} />;
    default:
      notFound();
  }
};

export default UriSegmentsPage;
