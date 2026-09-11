"use client";
import { useRef } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { Icon } from "@/components/atoms/Icon";
import styles from "./styles.module.css";
export function Header() {
  const { t } = useTranslation();
  const locale = useLocale();
  const path = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const menu = useRef<HTMLDetailsElement>(null);
  const isViewer =
    path === "/explorer" || path.startsWith("/guided-experiences/");
  const close = () => {
    if (menu.current) menu.current.open = false;
  };
  return (
    <header className={styles.header} data-viewer={isViewer}>
      <Link href="/explorer" className={styles.brand} aria-label="Orbitviewer">
        <Image
          src="/images/orbitviewer-logo.svg"
          alt="Orbitviewer"
          width={65}
          height={40}
          priority
        />
      </Link>
      <div className={styles.actions}>
        {isViewer && (
          <button
            className={styles.share}
            onClick={() => window.dispatchEvent(new Event("orbitviewer-share"))}
          >
            <Icon name="share" />
            {t("ui.share")}
          </button>
        )}
        <details
          ref={menu}
          className={styles.menu}
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
        >
          <summary aria-label={t("wizard.button_group.aria")}>
            <Icon name="menu" />
          </summary>
          <nav aria-label={t("wizard.button_group.aria")}>
            <Link href="/explorer" onClick={close}>
              {t("ui.explorer")}
            </Link>
            <Link href="/guided-experiences" onClick={close}>
              {t("toolbar.guides")}
            </Link>
            <Link href="/about" onClick={close}>
              {t("ui.about")}
            </Link>
            <Link href="/how-to-use" onClick={close}>
              {t("ui.howTo")}
            </Link>
            <label>
              {t("ui.language")}
              <select
                value={locale}
                onChange={(event) =>
                  router.replace(`${path}${params.size ? `?${params}` : ""}`, {
                    locale: event.target.value,
                  })
                }
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </label>
          </nav>
        </details>
      </div>
    </header>
  );
}
