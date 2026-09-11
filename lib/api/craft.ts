import { graphql } from "@/gql";
import queryAPI from "@/lib/api/client";
import tagStore from "@/lib/api/tags";
import { siteIdFromLocale } from "@/lib/i18n/site";

/**
 * Craft CMS query service. Replaces the legacy `data/craft.js`, which was
 * loaded wholesale by the Eleventy config and exposed to every template.
 *
 * Note: the legacy `getAbout()` / `getHowToUse()` helpers queried root fields
 * (`aboutEntries`, `howToUseEntry`) that no longer exist in the schema. The
 * working path is `pagesEntries`, which returns About, How to Use and Landing
 * as a single union -- that is what is ported here.
 */

export const getGlobals = async ({ locale }: { locale: string }) => {
  const Query = graphql(`
    query SiteGlobals($siteId: [QueryArgument]) {
      globalSets(siteId: $siteId) {
        ... on defaultSEO_GlobalSet {
          seoSiteName
          seoTitle
          seoDescription
        }
      }
    }
  `);

  const { data } = await queryAPI({
    query: Query,
    variables: { siteId: [siteIdFromLocale(locale)] },
    fetchOptions: { next: { tags: [tagStore.globals] } },
  });

  return data?.globalSets?.[0] ?? undefined;
};

export const getCategories = async ({ locale }: { locale: string }) => {
  const Query = graphql(`
    query ObjectTypeCategories($siteId: [QueryArgument]) {
      categories(group: "objectTypes", siteId: $siteId) {
        ... on objectTypes_Category {
          title
          slug
          mainColor
          objectTypeCode
          description
        }
      }
    }
  `);

  const { data } = await queryAPI({
    query: Query,
    variables: { siteId: [siteIdFromLocale(locale)] },
    fetchOptions: { next: { tags: [tagStore.categories] } },
  });

  return data?.categories ?? [];
};

export const getSolarElements = async ({ locale }: { locale: string }) => {
  const Query = graphql(`
    query SolarElements($siteId: [QueryArgument]) {
      entries(section: "elements", siteId: $siteId) {
        ... on elements_default_Entry {
          title
          elementID
          textBody {
            html
            plainText
          }
          elementPreview {
            url @transform(width: 800, format: "webp")
          }
          elementDiameter
          elementCategory {
            slug
          }
          viewInSkyviewerLink
        }
      }
    }
  `);

  const { data } = await queryAPI({
    query: Query,
    variables: { siteId: [siteIdFromLocale(locale)] },
    fetchOptions: { next: { tags: [tagStore.elements] } },
  });

  return data?.entries ?? [];
};

export const getPages = async ({ locale }: { locale: string }) => {
  const Query = graphql(`
    query Pages($siteId: [QueryArgument]) {
      pagesEntries(siteId: $siteId) {
        ... on EntryInterface {
          id
          slug
          title
        }
      }
    }
  `);

  const { data } = await queryAPI({
    query: Query,
    variables: { siteId: [siteIdFromLocale(locale)] },
    fetchOptions: { next: { tags: [tagStore.pages] } },
  });

  return data?.pagesEntries ?? [];
};

export const getDataFileUrls = async () => {
  const Query = graphql(`
    query MpcDataFiles {
      mpcDataFilesEntries {
        ... on mpcDataFiles_Entry {
          title
          dataFileUrl
          dataFileQuality
        }
      }
    }
  `);

  const { data } = await queryAPI({
    query: Query,
    variables: {},
    fetchOptions: { next: { tags: [tagStore.dataFiles] } },
  });

  // Keyed by quality tier: low | medium | high | ultra | ultra2
  return Object.fromEntries(
    (data?.mpcDataFilesEntries ?? []).flatMap((entry) =>
      entry && "dataFileQuality" in entry && entry.dataFileQuality
        ? [[entry.dataFileQuality, entry.dataFileUrl]]
        : []
    )
  ) as Record<string, string>;
};

export const getGuidedExperiences = async ({ locale }: { locale: string }) => {
  const Query = graphql(`
    query GuidedExperiences($siteId: [QueryArgument]) {
      guidedExperiencesToursEntries(siteId: $siteId) {
        ... on tour_Entry {
          featuredTour
          title
          slug
          postDate
          duration
          complexity
          tourPreview {
            title
            url @transform(width: 600, format: "webp")
          }
        }
      }
    }
  `);

  const { data } = await queryAPI({
    query: Query,
    variables: { siteId: [siteIdFromLocale(locale)] },
    fetchOptions: { next: { tags: [tagStore.tours] } },
  });

  return data?.guidedExperiencesToursEntries ?? [];
};
