import type { FunctionComponent } from "react";
import { getLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { serverTranslation } from "@/lib/i18n/server";
import ContentHeader from "@/components/molecules/ContentHeader";
import styles from "./not-found.module.css";

const NotFound: FunctionComponent = async () => {
  const locale = await getLocale();
  const { t } = await serverTranslation(locale);

  return (
    <>
      <ContentHeader locale={locale} />
      <main className={styles.page}>
        <div className={styles.content}>
          <div className={styles.body}>
            <h1 className={styles.title}>Error 404</h1>
            <h2 className={styles.subtitle} lang={locale}>
              {t("e404.subtitle")}
            </h2>
          </div>
          <div className={styles.foot}>
            <Link className={styles.action} href="/">
              {t("e404.action")}
            </Link>
          </div>
        </div>
      </main>
    </>
  );
};

export default NotFound;
