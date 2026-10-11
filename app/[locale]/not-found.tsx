import type { FunctionComponent } from "react";
import { getLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { serverTranslation } from "@/lib/i18n/server";
import ContentHeader from "@/components/molecules/ContentHeader";
import styles from "./not-found.module.css";

/**
 * Ported from `pages/404.njk` and `pages/404Page.ts`.
 *
 * Two things the legacy does that this does not, both deliberate:
 *
 * The scene. The legacy renders this over the live viewer and calls
 * `followRandomPlanet()`, so the camera drifts up to a planet behind the
 * type -- it can afford to, because it is a single-page shell whose canvas
 * never unmounts. Mounting the canvas here would mean loading the MPC
 * dataset to render an error page. The scene backdrop is the same decision
 * the splash and the tour list are waiting on, and belongs with them rather
 * than being settled three times.
 *
 * The chrome. The legacy puts its full navigation on every page, share
 * button included. This uses `ContentHeader`, as About and How to Use do;
 * offering "share" on a page that is nothing but an error is not worth
 * matching, and the header difference is already tracked across the content
 * pages as one item.
 *
 * `not-found.tsx` is not passed `params`, so the locale comes from the
 * request rather than the route.
 */

const NotFound: FunctionComponent = async () => {
  const locale = await getLocale();
  const { t } = await serverTranslation(locale);

  return (
    <>
      <ContentHeader locale={locale} />
      <main className={styles.page}>
        <div className={styles.content}>
          <div className={styles.body}>
            {/* Untranslated in the legacy too -- the markup hardcodes it
                while the subtitle below comes from the copy deck. */}
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
