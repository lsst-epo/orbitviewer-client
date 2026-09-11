import { FunctionComponent } from "react";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPages } from "@/lib/api/craft";

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

export async function generateMetadata({
  params,
}: UriSegmentsPageProps): Promise<Metadata> {
  const { locale, uriSegments } = await params;
  setRequestLocale(locale);
  const uri = uriSegments.join("/");
  const pages = await getPages({ locale });
  const page = pages.find((entry) => entry?.slug === uri);

  return { title: page?.title ?? undefined };
}

const UriSegmentsPage: FunctionComponent<UriSegmentsPageProps> = async ({
  params,
}) => {
  const { locale, uriSegments } = await params;
  setRequestLocale(locale);
  const uri = uriSegments.join("/");

  if (RESERVED_SLUGS.has(uri)) notFound();

  const pages = await getPages({ locale });
  const page = pages.find((entry) => entry?.slug === uri);

  if (!page) notFound();

  // SCAFFOLD: About and How to Use have very different shapes (About is a
  // fixed set of fields; How to Use is a section matrix). Their templates
  // land in a later phase, along with the full field queries.
  return (
    <main>
      <h1>{page.title}</h1>
    </main>
  );
};

export default UriSegmentsPage;
