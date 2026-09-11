import Image from "next/image";
import type { ContentPage } from "@/lib/api/craft";
import type { Locale } from "@/lib/i18n/settings";
import { Link } from "@/lib/i18n/navigation";
import { RichText } from "@/components/atoms/RichText";
import styles from "./styles.module.css";
export function Landing({
  content,
  locale,
}: {
  content?: ContentPage;
  locale: Locale;
}) {
  return (
    <main className={styles.landing}>
      <div className={styles.content}>
        <Image
          src="/images/rubin-nsf-doe-triad.png"
          width={440}
          height={130}
          alt="NSF–DOE Vera C. Rubin Observatory"
          priority
        />
        <p>
          {content?.eyebrowText ??
            (locale === "es"
              ? "Explora nuestro Sistema Solar"
              : "Mapping the Solar System Like Never Before")}
        </p>
        <h1 className={styles.headline}>
          <RichText
            inline
            html={
              content?.headlineText ??
              "<h1>NSF–DOE Vera C. Rubin Observatory’s 3D Orbitviewer</h1>"
            }
          />
        </h1>
        <Link className={styles.start} href="/explorer">
          {content?.buttonLabel ??
            (locale === "es" ? "Comenzar a explorar" : "Start Exploring")}
        </Link>
        <Link href="/guided-experiences">
          {locale === "es" ? "Explorar los tours" : "Explore the tours"}
        </Link>
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
    </main>
  );
}
