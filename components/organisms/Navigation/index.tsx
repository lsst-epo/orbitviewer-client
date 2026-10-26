"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FunctionComponent,
} from "react";
import clsx from "clsx/lite";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import useClientTranslation from "@/lib/i18n/client";
import { languages } from "@/lib/i18n/settings";
import Icon, { type IconName } from "@/components/atoms/Icon";
import { SIM_QUALITIES, type SimQuality } from "@/lib/solar/quality";
import styles from "./styles.module.css";

/** Tier order, coarsest first, as the legacy's menu listed them. */
const OFFERED_QUALITIES: Array<SimQuality> = SIM_QUALITIES.filter(
  (quality): quality is SimQuality => quality !== "ultra2"
);

type Submenu = "language" | "exploration" | null;

export interface NavigationProps {
  locale: string;
  /** Omitted where there is no scene to share. */
  onShare?: () => void;
  /** Omitted where there is no scene; hides the exploration-mode item. */
  quality?: SimQuality;
  onQualityChange?: (quality: SimQuality) => void;
}

const Navigation: FunctionComponent<NavigationProps> = ({
  locale,
  onShare,
  quality,
  onQualityChange,
}) => {
  const { t } = useClientTranslation(locale);
  const router = useRouter();
  const pathname = usePathname();
  const menuId = useId();

  const [open, setOpen] = useState(false);
  const [submenu, setSubmenu] = useState<Submenu>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Fullscreen can be left by pressing Escape, which fires no click of ours,
    // so the state is driven by the document rather than by our own.
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    sync();

    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    const frame = requestAnimationFrame(() =>
      document.addEventListener("pointerdown", onPointerDown)
    );

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setSubmenu(null);
  }, [open]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => undefined);
    setOpen(false);
  };

  const qualityLabel = quality ? t(`exploration.${quality}.title`) : undefined;

  return (
    <nav
      ref={rootRef}
      className={styles.navigation}
      aria-label={t("navigation.aria")}
      data-wizard-step="navigation"
    >
      {onShare && (
        <button
          type="button"
          className={styles.share}
          onClick={() => {
            setOpen(false);
            onShare();
          }}
        >
          <Icon name="upload" aria-hidden />
          <span>{t("navigation.share")}</span>
        </button>
      )}

      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t("navigation.aria")}
      >
        <Icon name="menu" aria-hidden />
      </button>

      <div
        id={menuId}
        className={clsx(styles.menu, open && styles.menuOpen)}
        hidden={!open}
      >
        {submenu === null && (
          <div className={styles.level}>
            <section className={styles.group}>
              <h3 className={styles.groupLabel}>{t("navigation.settings")}</h3>
              <ul className={styles.list}>
                <Item
                  icon="language"
                  label={t("core.languages.label")}
                  value={t(`core.languages.${localeKey(locale)}.full`)}
                  onClick={() => setSubmenu("language")}
                  expands
                />

                {quality && onQualityChange && (
                  <Item
                    icon="settings"
                    label={t("navigation.exploration")}
                    value={qualityLabel}
                    onClick={() => setSubmenu("exploration")}
                    expands
                  />
                )}

                <Item
                  icon={fullscreen ? "fullscreenOff" : "fullscreen"}
                  label={t("navigation.fullscreen")}
                  onClick={toggleFullscreen}
                />
              </ul>
            </section>

            <section className={styles.group}>
              <h3 className={styles.groupLabel}>{t("navigation.help")}</h3>
              <ul className={styles.list}>
                <li>
                  <Link
                    className={styles.link}
                    href="/how-to-use"
                    onClick={() => setOpen(false)}
                  >
                    <Icon name="help" aria-hidden />
                    <span className={styles.itemLabel}>
                      {t("navigation.how_to_use")}
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    className={styles.link}
                    href="/about"
                    onClick={() => setOpen(false)}
                  >
                    <Icon name="info" aria-hidden />
                    <span className={styles.itemLabel}>
                      {t("navigation.about")}
                    </span>
                  </Link>
                </li>
              </ul>
            </section>
          </div>
        )}

        {submenu === "language" && (
          <Submenu
            title={t("core.languages.label")}
            backLabel={t("navigation.back")}
            onBack={() => setSubmenu(null)}
          >
            {languages.map((code) => (
              <li key={code}>
                <button
                  type="button"
                  className={styles.link}
                  lang={code}
                  aria-current={code === locale ? "true" : undefined}
                  onClick={() => {
                    setOpen(false);
                    router.replace(pathname, { locale: code });
                  }}
                >
                  <span className={styles.itemLabel}>
                    {t(`core.languages.${localeKey(code)}.full`)}
                  </span>
                  {code === locale && <Icon name="check" aria-hidden />}
                </button>
              </li>
            ))}
          </Submenu>
        )}

        {submenu === "exploration" && quality && onQualityChange && (
          <Submenu
            title={t("navigation.exploration")}
            backLabel={t("navigation.back")}
            onBack={() => setSubmenu(null)}
          >
            {OFFERED_QUALITIES.map((tier) => (
              <li key={tier}>
                <button
                  type="button"
                  className={styles.link}
                  aria-current={tier === quality ? "true" : undefined}
                  onClick={() => {
                    onQualityChange(tier);
                    setOpen(false);
                  }}
                >
                  <span className={styles.tier}>
                    <span className={styles.itemLabel}>
                      {t(`exploration.${tier}.title`)}
                    </span>
                    <span className={styles.tierDetail}>
                      {t(`exploration.${tier}.name`)} ·{" "}
                      {Number(t(`exploration.${tier}.objects`)).toLocaleString(
                        locale
                      )}{" "}
                      {t("core.objects")}
                    </span>
                  </span>
                  {tier === quality && <Icon name="check" aria-hidden />}
                </button>
              </li>
            ))}
          </Submenu>
        )}
      </div>
    </nav>
  );
};

/** `en` -> `english`, matching the copy file's key names. */
const localeKey = (locale: string) => (locale === "es" ? "spanish" : "english");

const Item: FunctionComponent<{
  icon: IconName;
  label: string;
  value?: string;
  onClick: () => void;
  expands?: boolean;
}> = ({ icon, label, value, onClick, expands }) => (
  <li>
    <button
      type="button"
      className={styles.link}
      onClick={onClick}
      aria-expanded={expands ? false : undefined}
    >
      <Icon name={icon} aria-hidden />
      <span className={styles.itemLabel}>{label}</span>
      {value && <span className={styles.itemValue}>{value}</span>}
      {expands && <Icon name="chevronRight" aria-hidden />}
    </button>
  </li>
);

const Submenu: FunctionComponent<{
  title: string;
  backLabel: string;
  onBack: () => void;
  children: React.ReactNode;
}> = ({ title, backLabel, onBack, children }) => (
  <div className={styles.level}>
    <div className={styles.submenuHead}>
      <button
        type="button"
        className={styles.back}
        onClick={onBack}
        aria-label={backLabel}
      >
        <Icon name="chevronLeft" aria-hidden />
      </button>
      <h3 className={styles.groupLabel}>{title}</h3>
    </div>
    <ul className={styles.list}>{children}</ul>
  </div>
);

export default Navigation;
