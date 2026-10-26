"use client";

import type { FunctionComponent } from "react";
import clsx from "clsx/lite";
import { Link } from "@/lib/i18n/navigation";
import useClientTranslation from "@/lib/i18n/client";
import Icon, { type IconName } from "@/components/atoms/Icon";
import { useExplorer } from "@/contexts/Explorer";
import type { ExplorerPanel } from "@/lib/explorer/searchParams";
import styles from "./styles.module.css";

interface PanelItem {
  panel: ExplorerPanel;
  icon: IconName;
  labelKey: string;
}

const PANEL_ITEMS: Array<PanelItem> = [
  { panel: "objects", icon: "orbit", labelKey: "toolbar.objects" },
  { panel: "filters", icon: "filters", labelKey: "toolbar.filters" },
  { panel: "search", icon: "search", labelKey: "toolbar.search" },
];

export interface ToolbarProps {
  locale: string;
}

const Toolbar: FunctionComponent<ToolbarProps> = ({ locale }) => {
  const { t } = useClientTranslation(locale);
  const { params, togglePanel } = useExplorer();

  return (
    <nav className={styles.toolbar} aria-label={t("toolbar.aria")}>
      <div className={styles.head} aria-hidden="true" />

      <ul className={styles.list} data-wizard-step="toolbar">
        {PANEL_ITEMS.map(({ panel, icon, labelKey }) => {
          const active = params.panel === panel;

          return (
            <li key={panel} className={styles.item}>
              <button
                type="button"
                className={clsx(styles.link, active && styles.active)}
                onClick={() => togglePanel(panel)}
                aria-expanded={active}
                aria-controls={`explorer-panel-${panel}`}
              >
                <Icon name={icon} />
                <span className={styles.label}>{t(labelKey)}</span>
              </button>
            </li>
          );
        })}

        <li
          className={clsx(styles.item, styles.spaced)}
          data-wizard-step="tours"
        >
          <Link href="/guided-experiences" className={styles.link}>
            <span className={styles.iconWrap}>
              <Icon name="guides" />
              <span className={styles.badge} aria-hidden="true" />
            </span>
            <span className={styles.label}>{t("toolbar.guides")}</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Toolbar;
