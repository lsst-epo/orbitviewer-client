import type { ContentPage as Page } from "@/lib/api/craft";
import { RichText } from "@/components/atoms/RichText";
import { CmsImage } from "@/components/atoms/CmsImage";
import { HowToUse } from "@/components/templates/HowToUse";
import styles from "./styles.module.css";
export function ContentPage({ page }: { page: Page }) {
  if (["how-to-use", "how_to_use"].includes(page.slug))
    return <HowToUse page={page} />;
  return (
    <main className={styles.page}>
      <header>
        <p>{page.eyebrowText}</p>
        <h1>{page.headerTitle ?? page.headerText ?? page.title}</h1>
        <RichText html={page.headerBody?.html} />
      </header>
      <RichText html={page.introBody?.html} />
      {page.introImage?.[0]?.url && (
        <CmsImage src={page.introImage[0].url} alt="" />
      )}
      <RichText html={page.responsiveBody?.html} />
      <div className={styles.modes}>
        {(["low", "medium", "high", "ultra"] as const).map(
          (mode) =>
            page[`${mode}SettingLabel`] && (
              <section key={mode}>
                <h2>{page[`${mode}SettingLabel`]}</h2>
                <p>{page[`${mode}SettingCount`]}</p>
                {page[`${mode}SettingImages`]?.map(
                  (asset) =>
                    asset.url && (
                      <CmsImage key={asset.url} src={asset.url} alt="" />
                    ),
                )}
              </section>
            ),
        )}
      </div>
      {page.howToUseSection?.map((section, index) => (
        <section key={index}>
          <h2>{section.sectionTitle}</h2>
          <RichText html={section.sectionBody?.html} />
          {section.sectionImage?.[0]?.url && (
            <CmsImage src={section.sectionImage[0].url} alt="" />
          )}
        </section>
      ))}
      <RichText html={page.observatoryBody?.html} />
      {page.observatoryImage?.[0]?.urlLarge && (
        <CmsImage src={page.observatoryImage[0].urlLarge} alt="" />
      )}
      <RichText html={page.footerBody?.html} />
      {page.footerImage?.[0]?.urlLarge && (
        <CmsImage src={page.footerImage[0].urlLarge} alt="" />
      )}
      <RichText html={page.creditsText?.html} />
    </main>
  );
}
