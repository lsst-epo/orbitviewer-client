import { FunctionComponent } from "react";
import Image from "next/image";
import type { getPages } from "@/lib/api/craft";
import { serverTranslation } from "@/lib/i18n/server";
import { Link } from "@/lib/i18n/navigation";
import styles from "./styles.module.css";

interface SplashProps {
  locale: string;
  /** Craft's `landing` entry, from the pagesEntries union. */
  landing?: Awaited<ReturnType<typeof getPages>>[number];
}

const Splash: FunctionComponent<SplashProps> = async ({ locale, landing }) => {
  const { t } = await serverTranslation(locale, "translation");

  return (
    <main className={styles.splash}>
      <Image
        className={styles.logo}
        src="/images/orbitviewer-logo.svg"
        alt={t("logo.alt")}
        width={320}
        height={64}
        priority
      />
      <h1 className={styles.title}>{landing?.title ?? t("splash.title")}</h1>
      <Link className={styles.cta} href="/explorer">
        {t("splash.button")}
      </Link>
    </main>
  );
};

export default Splash;
