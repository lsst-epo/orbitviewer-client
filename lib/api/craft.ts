import "server-only";
import { cookies, draftMode } from "next/headers";
import type { Locale } from "@/lib/i18n/settings";
import { print, type DocumentNode } from "graphql";
import {
  GetSolarItemsInfoDocument,
  GetCategoriesDocument,
  GetPagesDocument,
  GetGuidedExperiencesDocument,
  GetJsonDataFilesDocument,
} from "@/gql/graphql";

export interface RichText {
  html?: string;
  plainText?: string;
}
export interface Asset {
  url?: string;
  urlLarge?: string;
  title?: string;
}
export interface SolarEntry {
  title: string;
  elementID: string;
  textBody?: RichText;
  elementPreview?: Asset[];
  elementDiameter?: number;
  elementCategory?: { slug: string }[];
  viewInSkyviewerLink?: string;
}
export interface Category {
  title: string;
  slug: string;
  mainColor: string;
  objectTypeCode: string;
  description?: string;
}
export interface Slide {
  slideTitle?: string;
  subTitle?: string;
  slideContent?: string;
  slideText?: string;
  thumbnail?: boolean;
  closeUp?: { elementID: string }[];
  Link1?: string;
  link1Text?: string;
  link2?: string;
  link2Text?: string;
  link3?: string;
  link3Text?: string;
  link4?: string;
  link4Text?: string;
}
export interface Tour {
  title: string;
  slug: string;
  featuredTour?: boolean;
  postDate: string;
  duration: number;
  complexity: number;
  tourPreview?: Asset[];
  tourPicker?: { title: string }[];
  flexible: Slide[];
}
export interface ContentPage {
  id: string;
  slug: string;
  title?: string;
  eyebrowText?: string;
  headlineText?: string;
  buttonLabel?: string;
  discoveryLabel?: string;
  logoImage?: Asset[];
  headerTitle?: string;
  headerText?: string;
  headerBody?: RichText;
  introBody?: RichText;
  introImage?: Asset[];
  responsiveBody?: RichText;
  observatoryBody?: RichText;
  observatoryImage?: Asset[];
  footerBody?: RichText;
  footerImage?: Asset[];
  creditsText?: RichText;
  lowSettingLabel?: string;
  lowSettingCount?: string;
  lowSettingImages?: Asset[];
  mediumSettingLabel?: string;
  mediumSettingCount?: string;
  mediumSettingImages?: Asset[];
  highSettingLabel?: string;
  highSettingCount?: string;
  highSettingImages?: Asset[];
  ultraSettingLabel?: string;
  ultraSettingCount?: string;
  ultraSettingImages?: Asset[];
  howToUseSection?: {
    sectionTitle: string;
    sectionBody?: RichText;
    sectionImage?: Asset[];
  }[];
}

export async function queryCraft<T>(
  query: string | DocumentNode,
  variables: Record<string, unknown> = {},
  previewToken?: string,
): Promise<T> {
  const draft = await draftMode();
  const token =
    previewToken ??
    (draft.isEnabled
      ? (await cookies()).get("previewToken")?.value
      : undefined);
  const endpoint = new URL(
    process.env.API_URL ?? "https://api.orbitviewer.app/api",
  );
  if (token) endpoint.searchParams.set("token", token);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      query: typeof query === "string" ? query : print(query),
      variables,
    }),
    ...(draft.isEnabled || token
      ? { cache: "no-store" as const }
      : { next: { revalidate: 3600, tags: ["craft"] } }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(`Craft request failed (${response.status})`);
  const result = (await response.json()) as {
    data?: T;
    errors?: { message: string }[];
  };
  if (result.errors?.length || !result.data)
    throw new Error(
      result.errors?.map(({ message }) => message).join("; ") ||
        "Craft returned no data",
    );
  return result.data;
}

const siteId = (locale: Locale) => (locale === "en" ? 1 : 2);
export async function getSolarEntries(locale: Locale) {
  const { entries } = await queryCraft<{ entries: SolarEntry[] }>(
    GetSolarItemsInfoDocument,
    { siteId: [siteId(locale)] },
  );
  return entries
    .filter((entry) => entry.elementID)
    .map((entry) => ({
      ...entry,
      elementID: entry.elementID === "Sol" ? "sun" : entry.elementID,
    }));
}
export async function getCategories(locale: Locale) {
  return (
    await queryCraft<{ categories: Category[] }>(GetCategoriesDocument, {
      siteId: [siteId(locale)],
    })
  ).categories;
}
export async function getPages(locale: Locale) {
  return (
    await queryCraft<{ pagesEntries: ContentPage[] }>(GetPagesDocument, {
      siteId: [siteId(locale)],
    })
  ).pagesEntries;
}
export async function getTours(locale: Locale): Promise<Tour[]> {
  const { guidedExperiencesToursEntries } = await queryCraft<{
    guidedExperiencesToursEntries: Omit<Tour, "slug">[];
  }>(GetGuidedExperiencesDocument, { siteId: [siteId(locale)] });
  const counts = new Map<string, number>();
  return guidedExperiencesToursEntries
    .filter((entry) => entry.title && entry.flexible?.length)
    .map((entry) => {
      const base = entry.title
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      const count = (counts.get(base) ?? 0) + 1;
      counts.set(base, count);
      return {
        ...entry,
        slug: count === 1 ? base : `${base}-${count}`,
        flexible: entry.flexible.map((slide) => ({
          ...slide,
          closeUp: slide.closeUp?.map((object) => ({
            elementID: object.elementID === "Sol" ? "sun" : object.elementID,
          })),
        })),
      };
    });
}
export async function getCatalogFiles() {
  return (
    await queryCraft<{
      mpcDataFilesEntries: { dataFileUrl: string; dataFileQuality: string }[];
    }>(GetJsonDataFilesDocument)
  ).mpcDataFilesEntries;
}
