import { FunctionComponent } from "react";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getSolarElements } from "@/lib/api/craft";
import { ogImageForElement } from "@/lib/static/globals";
import { parseExplorerParams } from "@/lib/explorer/searchParams";
import { resolveCraftElement } from "@/lib/explorer/resolveObject";

interface ExplorerPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | Array<string> | undefined>>;
}

/**
 * Per-object metadata for the detail panel. This is what preserves the OG
 * cards and titles that the legacy /solar-items/<slug>/ pages emitted, now
 * that those URLs 308 to /explorer?object=<slug>.
 */
export async function generateMetadata({
  params,
  searchParams,
}: ExplorerPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const { object } = parseExplorerParams(await searchParams);

  if (!object) return {};

  const elements = await getSolarElements({ locale });

  type SolarElementEntry = Extract<
    (typeof elements)[number],
    { elementID?: string | null }
  >;

  const element = resolveCraftElement(
    elements.filter(
      (entry): entry is SolarElementEntry =>
        entry !== null && "elementID" in entry
    ),
    object
  );

  if (!element) return {};

  const description = element.textBody?.plainText?.slice(0, 150);

  return {
    title: element.title ?? undefined,
    description,
    openGraph: {
      title: element.title ?? undefined,
      description,
      images: [ogImageForElement(element.elementID)],
    },
  };
}

/**
 * The explorer has no overlay of its own: the template is mounted by the
 * group layout, and this route contributes only its metadata.
 */
const ExplorerPage: FunctionComponent<ExplorerPageProps> = async ({
  params,
}) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return null;
};

export default ExplorerPage;
