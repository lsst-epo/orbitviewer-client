"use client";
import { OrbitviewerLogo } from "@/components/atoms/OrbitviewerLogo";
import { useTranslation } from "react-i18next";
import { usePathname } from "@/lib/i18n/navigation";
import { Icon } from "@/components/atoms/Icon";
import { NavigationMenu } from "@/components/organisms/NavigationMenu";
import styles from "./styles.module.css";
export function Header() {
  const { t } = useTranslation();
  const path = usePathname();
  const isViewer =
    path === "/explorer" || path.startsWith("/guided-experiences/");
  const isGuideIndex = path === "/guided-experiences";
  return (
    <header
      className={styles.header}
      data-viewer={isViewer}
      data-home={path === "/"}
      data-guides={isGuideIndex}
      data-content={path === "/how-to-use"}
    >
      <OrbitviewerLogo toolbar={isViewer} />
      <div className={styles.actions}>
        {(isViewer || path === "/") && (
          <button
            className={styles.share}
            onClick={() => window.dispatchEvent(new Event("orbitviewer-share"))}
          >
            <Icon name="share" />
            {t("ui.share")}
          </button>
        )}
        <NavigationMenu />
      </div>
    </header>
  );
}
