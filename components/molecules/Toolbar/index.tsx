"use client";

import type { FunctionComponent } from "react";
import clsx from "clsx/lite";
import { Link } from "@/lib/i18n/navigation";
import useClientTranslation from "@/lib/i18n/client";
import Icon, { type IconName } from "@/components/atoms/Icon";
import { useExplorer } from "@/contexts/Explorer";
import type { ExplorerPanel } from "@/lib/explorer/searchParams";
import styles from "./styles.module.css";

/**
 * Primary explorer toolbar.
 *
 * Ported from `layers/Toolbar.ts` and `partials/toolbar.njk`. The legacy
 * version queried `.toolbar-link[data-open]`, bound click handlers manually,
 * and kept active state in sync by adding and removing a class from the
 * outside. Here the open panel is a value in the URL, so the active state is
 * derived rather than maintained.
 *
 * Objects and Guided Experiences are real navigation; filters and search
 * toggle panels.
 */

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
    <nav
      className={styles.toolbar}
      aria-label={t("toolbar.aria", { defaultValue: "Explorer tools" })}
    >
      <ul className={styles.list}>
        {PANEL_ITEMS.map(({ panel, icon, labelKey }) => {
          const active = params.panel === panel;

          return (
            <li key={panel} className={styles.item}>
              <button
                type="button"
                className={clsx(styles.link, active && styles.active)}
                onClick={() => togglePanel(panel)}
                // The panel is a sibling, not a child, so aria-expanded plus
                // aria-controls is the correct relationship to express.
                aria-expanded={active}
                aria-controls={`explorer-panel-${panel}`}
              >
                <Icon name={icon} />
                <span className={styles.label}>{t(labelKey)}</span>
              </button>
            </li>
          );
        })}

        <li className={clsx(styles.item, styles.spaced)}>
          <Link href="/guided-experiences" className={styles.link}>
            <Icon name="guides" />
            <span className={styles.label}>{t("toolbar.guides")}</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Toolbar;
