import type { FunctionComponent } from "react";
import Image from "next/image";
import type { Slide, Tour } from "@/lib/tours";
import styles from "./styles.module.css";

/**
 * One slide's body.
 *
 * Craft has four block types and the legacy rendered only the fields that
 * `defaultSlide` carries -- `subTitle`, `slideTitle`, `slideContent` -- for
 * every one of them. A fun-fact slide has no title, so it came out as a bare
 * paragraph under an empty heading; a share slide has none of those three
 * fields at all, so it rendered completely blank, losing its title, its body
 * and all four of its links. Each type is handled here.
 */

export interface SlideBodyProps {
  slide: Slide;
  /** Shown on the opening slide only, as in the legacy. */
  preview?: NonNullable<Tour["tourPreview"]>[number];
  showPreview: boolean;
  funFactLabel: string;
}

const SlideBody: FunctionComponent<SlideBodyProps> = ({
  slide,
  preview,
  showPreview,
  funFactLabel,
}) => {
  if (slide.__typename === "shareSlide_Entry") {
    const links = (
      [
        [slide.Link1, slide.link1Text],
        [slide.link2, slide.link2Text],
        [slide.link3, slide.link3Text],
        [slide.link4, slide.link4Text],
      ] as const
    ).flatMap(([url, text]) => (url ? [{ url, text: text || url }] : []));

    return (
      <div className={styles.body}>
        {slide.slideTitle && (
          <h3 className={styles.slideTitle}>{slide.slideTitle}</h3>
        )}
        {slide.slideText && <p className={styles.text}>{slide.slideText}</p>}

        {links.length > 0 && (
          <nav className={styles.links} aria-label={slide.linksTitle ?? ""}>
            {slide.linksTitle && (
              <h4 className={styles.linksTitle}>{slide.linksTitle}</h4>
            )}
            <ul className={styles.linkList}>
              {links.map(({ url, text }) => (
                <li key={url}>
                  {/* Craft-authored and outbound, so opened in a new tab with
                      the opener severed. */}
                  <a
                    className={styles.link}
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    );
  }

  if (slide.__typename === "funFactSlide_Entry") {
    return (
      <div className={styles.body}>
        <p className={styles.eyebrow}>{funFactLabel}</p>
        {slide.slideContent && (
          <p className={styles.text}>{slide.slideContent}</p>
        )}
      </div>
    );
  }

  const isIntro = slide.__typename === "introSlide_Entry";

  return (
    <div className={styles.body}>
      {isIntro && showPreview && preview?.url && (
        <Image
          className={styles.hero}
          src={preview.url}
          alt={preview.alt ?? ""}
          width={preview.width ?? 1200}
          height={preview.height ?? 675}
          sizes="(max-width: 48rem) 100vw, 24rem"
          priority
        />
      )}

      {slide.subTitle && <p className={styles.eyebrow}>{slide.subTitle}</p>}
      {slide.slideTitle && (
        <h3 className={styles.slideTitle}>{slide.slideTitle}</h3>
      )}
      {slide.slideContent && (
        // Craft stores these as plain text with newlines, so paragraphs are
        // split out rather than collapsed into one block by HTML whitespace.
        <div className={styles.text}>
          {slide.slideContent
            .split(/\n{2,}|\n/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
        </div>
      )}
    </div>
  );
};

export default SlideBody;
