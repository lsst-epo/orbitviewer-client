"use client";
import { useState } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import type { ContentPage as Page } from "@/lib/api/craft";
import { RichText } from "@/components/atoms/RichText";
import { CmsImage } from "@/components/atoms/CmsImage";
import { HowToUse } from "@/components/templates/HowToUse";
import styles from "./styles.module.css";

const MODES = ["ultra", "high", "medium", "low"] as const;

export function ContentPage({ page }: { page: Page }) {
  const { t, i18n } = useTranslation();
  const [activeMode, setActiveMode] = useState<(typeof MODES)[number]>("ultra");

  if (["how-to-use", "how_to_use"].includes(page.slug))
    return <HowToUse page={page} />;

  const activeCount = page[`${activeMode}SettingCount`];
  const activeImage = page[`${activeMode}SettingImages`]?.[0]?.url;

  return (
    <main className={styles.page}>
      <section className={styles.aboutHeading}>
        <Image
          className={styles.logoTriad}
          src="/images/rubin-nsf-doe-triad.png"
          alt="Vera C. Rubin Observatory, NSF, DOE"
          width={256}
          height={86}
        />
        <div className={styles.grid}>
          <div className={styles.headingCol}>
            {page.eyebrowText && (
              <h1 className={styles.eyebrow}>{page.eyebrowText}</h1>
            )}
            <p className={styles.subtitle}>
              {page.headerTitle ?? page.headerText ?? page.title}
            </p>
            <div className={styles.headerBody}>
              <RichText html={page.headerBody?.html} />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.aboutViewer}>
        <div className={styles.grid}>
          <div className={styles.viewerText}>
            <RichText html={page.introBody?.html} />
          </div>
          {page.introImage?.[0]?.url && (
            <div className={styles.viewerImage}>
              <CmsImage src={page.introImage[0].url} alt="" />
            </div>
          )}
        </div>
      </section>

      <section className={styles.aboutDevice}>
        <div className={styles.grid}>
          <div className={styles.deviceShowroom}>
            <div className={styles.device} data-mode={activeMode}>
              <div className={styles.mask}>
                {activeImage && <CmsImage src={activeImage} alt="" />}
              </div>
              {activeCount !== undefined && (
                <div className={styles.count}>
                  <strong>
                    {Number(activeCount).toLocaleString(i18n.language)}
                  </strong>{" "}
                  <span>{t("core.objects")}</span>
                </div>
              )}
            </div>
            <div className={styles.tabs}>
              <div className={styles.tabList} role="tablist">
                {MODES.map((mode) => {
                  const label = page[`${mode}SettingLabel`];
                  if (!label) return null;
                  return (
                    <button
                      key={mode}
                      type="button"
                      role="tab"
                      aria-selected={activeMode === mode}
                      onClick={() => setActiveMode(mode)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className={styles.deviceContent}>
            <RichText html={page.responsiveBody?.html} />
          </div>
        </div>
      </section>

      <section className={styles.aboutObservatory}>
        <div className={styles.observatoryHead}>
          <div className={styles.grid}>
            <div className={styles.invite}>
              <RichText html={page.observatoryBody?.html} />
            </div>
            <h2 className={styles.heroTitle}>{t("about.observatory")}</h2>
          </div>
          {page.observatoryImage?.[0]?.urlLarge && (
            <picture className={styles.observatoryPicture}>
              <CmsImage src={page.observatoryImage[0].urlLarge} alt="" />
            </picture>
          )}
        </div>
        <div className={styles.observatoryBody}>
          <div className={styles.grid}>
            <div className={styles.observatoryContent}>
              <RichText html={page.footerBody?.html} />
              <p className={styles.logosRow}>
                <Image
                  src="/images/rubin-nsf-doe-row.png"
                  alt="Vera C. Rubin Observatory, NSF, DOE"
                  width={360}
                  height={64}
                />
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.aboutCredits}>
        <div className={styles.grid}>
          <h2 className={styles.heroTitle}>{t("about.credits")}</h2>
          <div className={styles.creditsContent}>
            <RichText html={page.creditsText?.html} />
          </div>
        </div>
      </section>
    </main>
  );
}
