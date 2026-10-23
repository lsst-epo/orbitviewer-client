import type { ContentPage } from "@/lib/api/craft";
import { RichText } from "@/components/atoms/RichText";
import { CmsImage } from "@/components/atoms/CmsImage";
import styles from "./styles.module.css";

export function HowToUse({ page }: { page: ContentPage }) {
  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <h1>{page.eyebrowText ?? page.title}</h1>
          <p className={styles.subtitle}>
            {page.headerText ?? page.headerTitle}
          </p>
          <nav aria-label={page.eyebrowText ?? page.title}>
            {page.howToUseSection?.map((section, index) => (
              <a key={index} href={`#section-${index}`}>
                {section.sectionTitle}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <div className={styles.content}>
        {page.howToUseSection?.map((section, index) => (
          <section key={index} id={`section-${index}`}>
            <h2>{section.sectionTitle}</h2>
            <RichText html={section.sectionBody?.html} />
            {section.sectionImage?.[0]?.url && (
              <CmsImage src={section.sectionImage[0].url} alt="" />
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
