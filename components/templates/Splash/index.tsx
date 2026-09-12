import type { FunctionComponent } from "react";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { serverTranslation } from "@/lib/i18n/server";
import { languages } from "@/lib/i18n/settings";
import type { getContentPage } from "@/lib/api/craft";
import styles from "./styles.module.css";

/**
 * Landing page.
 *
 * Ported from `partials/splash.njk` and `layers/Splash.ts`. Craft's `landing`
 * entry supplies the logo, headline, eyebrow and button label; the discovery
 * figure comes from Hasura.
 *
 * The legacy drew this over the running viewer and its start button kicked
 * off a performance test and the onboarding dialog. Here it is a page of its
 * own that links to /explorer, and the explorer decides for itself whether a
 * visit is a first one. That keeps a static landing page from having to boot
 * a WebGL context before anyone has asked to see the scene.
 */

type ContentPage = Awaited<ReturnType<typeof getContentPage>>;
export type LandingEntry = Extract<
  NonNullable<ContentPage>,
  { __typename: "landing_Entry" }
>;

export interface SplashProps {
  locale: string;
  landing?: LandingEntry;
  /** Rubin discoveries in the catalogue; omitted if Hasura is unreachable. */
  discoveries: number | null;
}

const Splash: FunctionComponent<SplashProps> = async ({
  locale,
  landing,
  discoveries,
}) => {
  const { t } = await serverTranslation(locale, "translation");
  const logo = landing?.logoImage?.[0];

  return (
    <main className={styles.splash}>
      <div className={styles.body}>
        {logo?.url ? (
          <Image
            className={styles.logo}
            src={logo.url}
            alt={t("splash.logo.alt")}
            width={logo.width ?? 564}
            height={logo.height ?? 302}
            priority
          />
        ) : (
          <Image
            className={styles.logo}
            src="/images/rubin-nsf-doe-triad.png"
            alt={t("splash.logo.alt")}
            width={564}
            height={302}
            priority
          />
        )}

        <div className={styles.heading}>
          <h1 className={styles.title}>{landing?.headlineText}</h1>
          <p className={styles.subtitle}>{landing?.eyebrowText}</p>
        </div>

        <Link className={styles.cta} href="/explorer">
          {landing?.buttonLabel}
        </Link>

        {discoveries !== null && (
          <div className={styles.count}>
            <p className={styles.countLabel}>{landing?.discoveryLabel}</p>
            <p className={styles.countValue}>
              {discoveries.toLocaleString(locale)}
            </p>
          </div>
        )}
      </div>

      {/* The legacy called a global `changeLang()` from a `javascript:` href,
          which is not a link at all -- no middle-click, no new tab, and
          nothing for a crawler to follow between the two localisations. */}
      <footer className={styles.foot}>
        <ul className={styles.languages}>
          {languages.map((code) => (
            <li key={code}>
              <Link
                className={styles.language}
                href="/"
                locale={code}
                hrefLang={code}
                aria-current={code === locale ? "page" : undefined}
              >
                {t(
                  `core.languages.${code === "es" ? "spanish" : "english"}.full`
                )}
              </Link>
            </li>
          ))}
        </ul>
      </footer>
    </main>
  );
};

export default Splash;
