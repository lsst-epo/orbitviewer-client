"use client";

import { FunctionComponent } from "react";
import { useExplorer } from "@/contexts/Explorer";
import useClientTranslation from "@/lib/i18n/client";
import styles from "./styles.module.css";

interface ExplorerProps {
  locale: string;
}

/**
 * Explorer shell.
 *
 * SCAFFOLD: the R3F canvas, the celestial-body components and the effects
 * components land in the next phase. This renders the data the provider
 * already holds so the route is verifiably wired end to end.
 */
const Explorer: FunctionComponent<ExplorerProps> = ({ locale }) => {
  const { t } = useClientTranslation(locale);
  const { elements, categories, classificationRanges, planets, params } =
    useExplorer();

  return (
    <main className={styles.explorer}>
      <div className={styles.placeholder}>
        <h1 className={styles.title}>{t("core.back")}</h1>
        <dl className={styles.stats}>
          <div>
            <dt>Craft elements</dt>
            <dd>{elements.length}</dd>
          </div>
          <div>
            <dt>Categories</dt>
            <dd>{categories.length}</dd>
          </div>
          <div>
            <dt>Classification ranges</dt>
            <dd>{classificationRanges.length}</dd>
          </div>
          <div>
            <dt>Planets</dt>
            <dd>{planets.length}</dd>
          </div>
          <div>
            <dt>Open object</dt>
            <dd>{params.object ?? "none"}</dd>
          </div>
        </dl>
      </div>
    </main>
  );
};

export default Explorer;
