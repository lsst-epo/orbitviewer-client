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

/**
 * One Craft content page, with every field its type carries.
 *
 * Separate from `getPages`, which stays lean: it is called for slug lookup
 * and for the landing entry, and neither needs About's two dozen fields or
 * How to Use's section matrix.
 *
 * Assets are queried with `width` and `height` so `next/image` can reserve
 * the space and avoid a layout shift; the legacy used bare `<img>` tags with
 * neither, so every image on these pages reflowed the article as it loaded.
 */
export const getContentPage = async ({
  locale,
  slug,
}: {
  locale: string;
  slug: string;
}) => {
  const Query = graphql(`
    query ContentPage($siteId: [QueryArgument], $slug: [String]) {
      pagesEntries(siteId: $siteId, slug: $slug) {
        # Craft's page types have no field in common beyond the interface, so
        # the typename is what consumers narrow on. Without it the generated
        # union members are only structurally distinct, and narrowing has to
        # guess from a field that happens to be unique.
        __typename
        ... on EntryInterface {
          id
          slug
          title
        }
        ... on about_Entry {
          eyebrowText
          headerTitle
          headerBody {
            html
            plainText
          }
          introBody {
            html
          }
          introImage {
            url @transform(width: 1200, format: "webp")
            width
            height
            alt
          }
          responsiveBody {
            html
          }
          lowSettingLabel
          lowSettingCount
          lowSettingImages {
            url @transform(width: 1200, format: "webp")
            width
            height
            alt
          }
          mediumSettingLabel
          mediumSettingCount
          mediumSettingImages {
            url @transform(width: 1200, format: "webp")
            width
            height
            alt
          }
          highSettingLabel
          highSettingCount
          highSettingImages {
            url @transform(width: 1200, format: "webp")
            width
            height
            alt
          }
          ultraSettingLabel
          ultraSettingCount
          ultraSettingImages {
            url @transform(width: 1200, format: "webp")
            width
            height
            alt
          }
          observatoryBody {
            html
          }
          observatoryImage {
            url @transform(width: 1600, format: "webp")
            width
            height
            alt
          }
          footerBody {
            html
          }
          creditsText {
            html
          }
        }
        ... on howToUse_Entry {
          eyebrowText
          headerText
          howToUseSection {
            ... on howToUseSection_section_BlockType {
              id
              sectionTitle
              sectionBody {
                html
                plainText
              }
              sectionImage {
                url @transform(width: 1200, format: "webp")
                width
                height
                alt
              }
            }
          }
        }
      }
    }
  `);

  const { data } = await queryAPI({
    query: Query,
    variables: { siteId: [siteIdFromLocale(locale)], slug: [slug] },
    fetchOptions: { next: { tags: [tagStore.pages] } },
  });

  return data?.pagesEntries?.[0] ?? undefined;
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
          tourPicker {
            ... on tours_Category {
              title
              slug
            }
          }
          tourPreview {
            title
            alt
            width
            height
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

/**
 * One tour with its whole slide deck.
 *
 * The deck is a Craft matrix of four block types, so every member is queried
 * and consumers narrow on `__typename`. The legacy read only the fields that
 * `defaultSlide` carries, which meant a fun-fact slide rendered as an empty
 * card and a share slide lost its title, body and all four links.
 *
 * `closeUp` points at an `elements` entry, and its `elementID` is the same id
 * the explorer's `object` param uses -- so a slide's object is addressable
 * without a second lookup.
 */
export const getGuidedExperience = async ({
  locale,
  slug,
}: {
  locale: string;
  slug: string;
}) => {
  const Query = graphql(`
    query GuidedExperience($siteId: [QueryArgument], $slug: [String]) {
      guidedExperiencesToursEntries(siteId: $siteId, slug: $slug) {
        ... on tour_Entry {
          title
          slug
          duration
          complexity
          seoTitle
          seoDescription
          tourPreview {
            title
            alt
            width
            height
            url @transform(width: 1200, format: "webp")
          }
          flexible {
            __typename
            ... on introSlide_Entry {
              id
              thumbnail
              slideTitle
              subTitle
              slideContent
            }
            ... on defaultSlide_Entry {
              id
              slideTitle
              subTitle
              slideContent
              closeUp {
                ... on elements_default_Entry {
                  elementID
                  title
                }
              }
            }
            ... on funFactSlide_Entry {
              id
              slideContent
            }
            ... on shareSlide_Entry {
              id
              slideTitle
              slideText
              linksTitle
              Link1
              link1Text
              link2
              link2Text
              link3
              link3Text
              link4
              link4Text
            }
          }
        }
      }
    }
  `);

  const { data } = await queryAPI({
    query: Query,
    variables: { siteId: [siteIdFromLocale(locale)], slug: [slug] },
    fetchOptions: { next: { tags: [tagStore.tours] } },
  });

  return data?.guidedExperiencesToursEntries?.[0] ?? undefined;
};
