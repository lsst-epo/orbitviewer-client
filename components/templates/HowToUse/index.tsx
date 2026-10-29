import type { FunctionComponent } from "react";
import Image from "next/image";
import type { getContentPage } from "@/lib/api/craft";
import RichText from "@/components/atoms/RichText";
import ContentHeader from "@/components/molecules/ContentHeader";
import styles from "./styles.module.css";

type ContentPage = Awaited<ReturnType<typeof getContentPage>>;
export type HowToUseEntry = Extract<
  NonNullable<ContentPage>,
  { __typename: "howToUse_Entry" }
>;

export interface HowToUseProps {
  locale: string;
  page: HowToUseEntry;
}

const HowToUse: FunctionComponent<HowToUseProps> = ({ locale, page }) => {
  const sections = (page.howToUseSection ?? []).flatMap((block) =>
    block && "sectionTitle" in block && block.sectionTitle ? [block] : []
  );

  return (
    <>
      <ContentHeader locale={locale} />

      <main className={styles.howTo}>
        <div className={styles.masthead}>
          <p className={styles.eyebrow}>{page.eyebrowText}</p>
          <h1 className={styles.title}>{page.headerText}</h1>

          {sections.length > 0 && (
            <nav className={styles.contents} aria-label={page.title ?? ""}>
              <ul className={styles.contentsList}>
                {sections.map((section) => (
                  <li key={section.id}>
                    <a className={styles.link} href={`#section-${section.id}`}>
                      {section.sectionTitle}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        {sections.map((section) => {
          const image = section.sectionImage?.[0];

          return (
            <article
              key={section.id}
              id={`section-${section.id}`}
              className={styles.block}
            >
              <h2 className={styles.blockTitle}>{section.sectionTitle}</h2>

              <figure className={styles.figure}>
                {image?.url && (
                  <Image
                    className={styles.shot}
                    src={image.url}
                    alt={image.alt ?? section.sectionTitle ?? ""}
                    width={image.width ?? 1520}
                    height={image.height ?? 840}
                    sizes="(max-width: 64rem) 100vw, 60rem"
                  />
                )}
                <figcaption className={styles.caption}>
                  <RichText html={section.sectionBody?.html} />
                </figcaption>
              </figure>
            </article>
          );
        })}
      </main>
    </>
  );
};

export default HowToUse;
