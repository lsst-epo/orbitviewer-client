import type { FunctionComponent } from "react";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { serverTranslation } from "@/lib/i18n/server";
import { languages } from "@/lib/i18n/settings";
import type { getContentPage } from "@/lib/api/craft";
import Chrome from "@/components/organisms/Chrome";
import DiscoveryCount from "./DiscoveryCount";
import LandingClock from "./LandingClock";
import styles from "./styles.module.css";

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
      <Chrome locale={locale} tour={false} />
      <LandingClock />

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
          <DiscoveryCount
            total={discoveries}
            label={landing?.discoveryLabel}
            locale={locale}
            announcement={t("splash.discoveries", {
              formatted: discoveries.toLocaleString(locale),
            })}
          />
        )}
      </div>

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
