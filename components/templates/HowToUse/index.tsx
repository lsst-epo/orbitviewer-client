import type { FunctionComponent } from "react";
import Image from "next/image";
import type { getContentPage } from "@/lib/api/craft";
import RichText from "@/components/atoms/RichText";
import ContentHeader from "@/components/molecules/ContentHeader";
import styles from "./styles.module.css";

/**
 * How to Use.
 *
 * Ported from `locale-templates/how_to_use.njk`. A masthead with an in-page
 * table of contents, then one titled article per Craft section.
 *
 * Section anchors are the block ids from Craft rather than the loop index the
 * legacy used (`#section-0`). An index-based anchor changes meaning whenever
 * an editor reorders or inserts a section, so every link into the page that
 * anyone had saved would silently start pointing somewhere else.
 *
 * The legacy also intercepted every table-of-contents click to scroll with
 * `document.body.scrollTo`, having to measure the navigation's height by hand
 * to offset it. `scroll-margin-top` on the targets does that in CSS, and
 * plain anchors then work -- including opening in a new tab, and arriving at
 * the right place on first load from a shared link, neither of which the
 * intercepted version did.
 */

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
                    // Craft carries no alt on these, and they are instructional
                    // rather than decorative, so the section title at least
                    // identifies what is being shown.
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
