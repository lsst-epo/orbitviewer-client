"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { Icon } from "@/components/atoms/Icon";
import {
  ExplorationModeMenu,
  explorationModes,
} from "@/components/molecules/ExplorationModeMenu";
import styles from "./styles.module.css";

export function NavigationMenu() {
  const { t } = useTranslation();
  const locale = useLocale();
  const path = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const [level, setLevel] = useState("main");
  const [quality, setQuality] = useState("low");
  useEffect(() => {
    const update = (event: Event) =>
      setQuality((event as CustomEvent<string>).detail);
    window.addEventListener("orbitviewer-quality", update);
    return () => window.removeEventListener("orbitviewer-quality", update);
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => {
    setMenuOpen(false);
    setLevel("main");
  };
  useEffect(() => {
    const loaded = () => {
      setMenuOpen(false);
      setLevel("main");
    };
    window.addEventListener("orbitviewer-catalog-loaded", loaded);
    return () =>
      window.removeEventListener("orbitviewer-catalog-loaded", loaded);
  }, []);
  return (
    <details
      open={menuOpen}
      onToggle={(event) => {
        setMenuOpen(event.currentTarget.open);
        if (event.currentTarget.open) {
          const saved = localStorage.getItem("rubin-data-profile");
          if (explorationModes.some((mode) => mode === saved))
            setQuality(saved!);
        } else setLevel("main");
      }}
      className={styles.menu}
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
    >
      <summary aria-label={t("wizard.button_group.aria")}>
        <Icon name="menu" />
      </summary>
      <nav aria-label={t("wizard.button_group.aria")}>
        {level === "main" ? (
          <>
            <div className={styles.group}>
              <h3>{t("navigation.settings")}</h3>
              <button onClick={() => setLevel("language")}>
                <Icon name="language" />
                <span>{t("ui.language")}</span>
                <small>{locale === "en" ? "English" : "Español"}</small>
              </button>
              <button onClick={() => setLevel("exploration")}>
                <Icon name="settings" />
                <span>{t("navigation.exploration")}</span>
                <small>{t(`exploration.${quality}.title`)}</small>
              </button>
              <button
                onClick={() => {
                  close();
                  void (document.fullscreenElement
                    ? document.exitFullscreen()
                    : document.documentElement.requestFullscreen());
                }}
              >
                <Icon name="fullscreen" />
                <span>{t("navigation.fullscreen")}</span>
              </button>
            </div>
            <div className={styles.group}>
              <h3>{t("navigation.help")}</h3>
              <Link href="/how-to-use" onClick={close}>
                <Icon name="how_it_works" />
                <span>{t("ui.howTo")}</span>
              </Link>
              <Link href="/about" onClick={close}>
                <Icon name="info" />
                <span>{t("ui.about")}</span>
              </Link>
            </div>
          </>
        ) : level === "exploration" ? (
          <ExplorationModeMenu
            value={quality}
            onBack={() => setLevel("main")}
            onChange={(value) => {
              if (value === quality) return;
              setQuality(value);
              localStorage.setItem("rubin-data-profile", value);
              window.dispatchEvent(
                new CustomEvent("orbitviewer-set-quality", { detail: value }),
              );
              if (
                path !== "/explorer" &&
                !path.startsWith("/guided-experiences/")
              )
                close();
            }}
          />
        ) : (
          <>
            <div className={styles.subhead}>
              <button
                aria-label={t("navigation.back")}
                onClick={() => setLevel("main")}
              >
                <Icon name="arrow-left" />
              </button>
              <h3>
                {t(
                  level === "language"
                    ? "ui.language"
                    : "navigation.exploration",
                )}
              </h3>
            </div>
            <div className={styles.group}>
              {["en", "es"].map((value) => (
                <button
                  key={value}
                  aria-pressed={locale === value}
                  onClick={() => {
                    router.replace(
                      `${path}${params.size ? `?${params}` : ""}`,
                      { locale: value },
                    );
                    close();
                  }}
                >
                  <span>{value === "en" ? "English" : "Español"}</span>
                  {locale === value && <Icon name="check" />}
                </button>
              ))}
            </div>
          </>
        )}
      </nav>
    </details>
  );
}
