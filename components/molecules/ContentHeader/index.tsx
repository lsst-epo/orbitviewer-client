import type { FunctionComponent } from "react";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { serverTranslation } from "@/lib/i18n/server";
import Icon from "@/components/atoms/Icon";
import styles from "./styles.module.css";

/**
 * Header for the standalone content pages.
 *
 * The legacy put the full `navigation.njk` -- share, the settings menu, the
 * language switcher -- on every page including these. That menu belongs with
 * the explorer chrome and lands in Phase H; what these pages actually need
 * now is a way back, which the legacy's own "Orbit viewer" back link
 * provided.
 *
 * Sticky, because these pages are long: How to Use runs to eight sections and
 * About to five, and the legacy's mobile code had to add a `sticky` class by
 * hand on scroll to get the same effect.
 */
const ContentHeader: FunctionComponent<{ locale: string }> = async ({
  locale,
}) => {
  const { t } = await serverTranslation(locale, "translation");

  return (
    <header className={styles.header}>
      <Link className={styles.back} href="/explorer">
        <Icon name="chevronLeft" aria-hidden />
        <span>{t("core.back")}</span>
      </Link>

      <Image
        className={styles.logo}
        src="/images/orbitviewer-logo.svg"
        alt={t("logo.alt")}
        width={160}
        height={32}
      />
    </header>
  );
};

export default ContentHeader;
