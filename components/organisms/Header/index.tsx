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
    path === "/" ||
    path === "/explorer" ||
    path.startsWith("/guided-experiences/");
  return (
    <header className={styles.header}>
      <OrbitviewerLogo />
      <div className={styles.actions}>
        {isViewer && (
          <button
            className={styles.share}
            onClick={() => window.dispatchEvent(new Event("orbitviewer-share"))}
          >
            <Icon name="share" />
            <span>{t("ui.share")}</span>
          </button>
        )}
        <NavigationMenu />
      </div>
    </header>
  );
}
