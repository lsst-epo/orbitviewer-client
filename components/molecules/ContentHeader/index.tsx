import type { FunctionComponent } from "react";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { serverTranslation } from "@/lib/i18n/server";
import Icon from "@/components/atoms/Icon";
import styles from "./styles.module.css";

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
