import { CmsImage } from "@/components/atoms/CmsImage";
import type { ContentPage } from "@/lib/api/craft";
import type { Locale } from "@/lib/i18n/settings";
import { Link } from "@/lib/i18n/navigation";
import { RichText } from "@/components/atoms/RichText";
import { DiscoveryCount, LandingSurface } from "./DiscoveryCount";
import styles from "./styles.module.css";
export function Landing({
  content,
  locale,
}: {
  content?: ContentPage;
  locale: Locale;
}) {
  return (
    <>
      <LandingSurface className={styles.landing}>
        <div className={styles.content}>
          <div className={styles.triad}>
            <CmsImage
              src={
                content?.logoImage?.[0]?.url ??
                "/images/rubin-nsf-doe-triad.png"
              }
              alt="NSF–DOE Vera C. Rubin Observatory"
              loading="eager"
            />
          </div>
          <div className={styles.heading}>
            <h1 className={styles.title}>
              <RichText
                inline
                html={
                  content?.headlineText ??
                  "NSF–DOE Vera C. Rubin Observatory’s 3D Orbitviewer"
                }
              />
            </h1>
            <p className={styles.subtitle}>
              {content?.eyebrowText ??
                (locale === "es"
                  ? "Explora nuestro Sistema Solar"
                  : "Mapping the Solar System Like Never Before")}
            </p>
          </div>
          <Link className={styles.start} href="/explorer">
            {content?.buttonLabel ??
              (locale === "es" ? "Comenzar a explorar" : "Start Exploring")}
          </Link>
          <div className={styles.count}>
            <p>
              {content?.discoveryLabel ??
                (locale === "es"
                  ? "Objetos descubiertos"
                  : "Objects discovered")}
            </p>
            <p className={styles.value}>
              <DiscoveryCount locale={locale} />
            </p>
          </div>
        </div>
        <footer>
          <Link
            href="/"
            locale="en"
            aria-current={locale === "en" ? "page" : undefined}
          >
            English
          </Link>
          <Link
            href="/"
            locale="es"
            aria-current={locale === "es" ? "page" : undefined}
          >
            Español
          </Link>
        </footer>
      </LandingSurface>
    </>
  );
}
