import type { FunctionComponent } from "react";
import Image from "next/image";
import { serverTranslation } from "@/lib/i18n/server";
import type { getContentPage } from "@/lib/api/craft";
import RichText from "@/components/atoms/RichText";
import ContentHeader from "@/components/molecules/ContentHeader";
import DeviceTabs, { type DeviceTier } from "./DeviceTabs";
import styles from "./styles.module.css";

type ContentPage = Awaited<ReturnType<typeof getContentPage>>;
export type AboutEntry = Extract<
  NonNullable<ContentPage>,
  { __typename: "about_Entry" }
>;

/** Mask shape per tier, standing in for the device it suits. */
const TIER_RATIOS: Record<string, string> = {
  ultra: "21 / 9",
  high: "16 / 9",
  medium: "9 / 16",
  low: "2 / 3",
};

const firstAsset = (
  assets: AboutEntry["introImage"] | undefined
): DeviceTier["image"] => {
  const asset = assets?.[0];
  if (!asset?.url) return undefined;

  return {
    url: asset.url,
    width: asset.width ?? 1200,
    height: asset.height ?? 675,
    alt: asset.alt,
  };
};

export interface AboutProps {
  locale: string;
  page: AboutEntry;
}

const About: FunctionComponent<AboutProps> = async ({ locale, page }) => {
  const { t } = await serverTranslation(locale, "translation");

  const tiers: Array<DeviceTier> = (
    [
      [
        "ultra",
        page.ultraSettingLabel,
        page.ultraSettingCount,
        page.ultraSettingImages,
      ],
      [
        "high",
        page.highSettingLabel,
        page.highSettingCount,
        page.highSettingImages,
      ],
      [
        "medium",
        page.mediumSettingLabel,
        page.mediumSettingCount,
        page.mediumSettingImages,
      ],
      [
        "low",
        page.lowSettingLabel,
        page.lowSettingCount,
        page.lowSettingImages,
      ],
    ] as const
  ).flatMap(([key, label, count, images]) =>
    label
      ? [
          {
            key,
            label,
            count: count ?? "",
            image: firstAsset(images),
            ratio: TIER_RATIOS[key],
          },
        ]
      : []
  );

  const intro = firstAsset(page.introImage);
  const observatory = firstAsset(page.observatoryImage);

  return (
    <>
      <ContentHeader locale={locale} />

      <main className={styles.about}>
        <section className={styles.masthead}>
          <Image
            className={styles.crest}
            src="/images/rubin-nsf-doe-triad.png"
            alt={t("splash.logo.alt")}
            width={420}
            height={120}
            priority
          />

          <div className={styles.mastheadBody}>
            <p className={styles.eyebrow}>{page.eyebrowText}</p>
            <h1 className={styles.title}>{page.headerTitle}</h1>
            <RichText html={page.headerBody?.html} size="lead" />
          </div>
        </section>

        {(intro || page.introBody?.html) && (
          <section className={styles.section}>
            {intro && (
              <Image
                className={styles.wide}
                src={intro.url}
                alt={intro.alt ?? ""}
                width={intro.width}
                height={intro.height}
                sizes="(max-width: 64rem) 100vw, 60rem"
              />
            )}
            <RichText className={styles.prose} html={page.introBody?.html} />
          </section>
        )}

        {tiers.length > 0 && (
          <section className={styles.section}>
            <DeviceTabs
              tiers={tiers}
              locale={locale}
              label={t("navigation.exploration")}
            />
            <RichText
              className={styles.prose}
              html={page.responsiveBody?.html}
            />
          </section>
        )}

        <section className={styles.observatory}>
          {observatory && (
            <Image
              className={styles.observatoryImage}
              src={observatory.url}
              alt={observatory.alt ?? ""}
              width={observatory.width}
              height={observatory.height}
              sizes="100vw"
            />
          )}

          <div className={styles.observatoryBody}>
            <RichText
              className={styles.prose}
              html={page.observatoryBody?.html}
              size="lead"
            />
            <h2 className={styles.sectionTitle}>
              {t("about.observatory_title")}
            </h2>
            <RichText className={styles.prose} html={page.footerBody?.html} />
            <Image
              className={styles.logos}
              src="/images/rubin-nsf-doe-row.png"
              alt={t("splash.logo.alt")}
              width={640}
              height={80}
            />
          </div>
        </section>

        {page.creditsText?.html && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t("about.credits")}</h2>
            <RichText className={styles.prose} html={page.creditsText.html} />
          </section>
        )}
      </main>
    </>
  );
};

export default About;
