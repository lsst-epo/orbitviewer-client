"use client";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useExplorer } from "@/contexts/ExplorerProvider";
import { Link } from "@/lib/i18n/navigation";
import { Icon } from "@/components/atoms/Icon";
import { CmsImage } from "@/components/atoms/CmsImage";
import styles from "./styles.module.css";

export function TourPlayer({
  title,
  slug,
  step,
  total,
  target,
  heroImage,
  subTitle,
  slideTitle,
  children,
}: {
  title: string;
  slug: string;
  step: number;
  total: number;
  target?: string;
  heroImage?: string;
  subTitle?: string;
  slideTitle?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const { select } = useExplorer();
  useEffect(() => {
    select(target, "orbit");
  }, [target, select]);
  const pct = ((step + 1) / Math.max(1, total)) * 100;
  return (
    <section className={styles.player} aria-label={title}>
      <div className={styles.card}>
        <header className={styles.head}>
          <span className={styles.tourTitle}>{title}</span>
          <span className={styles.stepCount}>
            {step + 1} / {total}
          </span>
          <div className={styles.progress} aria-hidden="true">
            <span
              className={styles.progressCurrent}
              style={{ width: `${pct}%` }}
            />
          </div>
        </header>
        <div className={styles.body}>
          {heroImage && (
            <div className={styles.hero}>
              <CmsImage src={heroImage} alt="" />
            </div>
          )}
          <div className={styles.content}>
            {subTitle && <p className={styles.eyebrow}>{subTitle}</p>}
            <div className={styles.text}>
              {slideTitle && <h2>{slideTitle}</h2>}
              {children}
            </div>
          </div>
        </div>
        <footer className={styles.foot}>
          <Link href="/guided-experiences" className={styles.backBtn}>
            <Icon name="chevron-left" />
            <span>{t("guides.entry.navigation.guides")}</span>
          </Link>
          <nav
            className={styles.nav}
            aria-label={t("wizard.button_group.aria")}
          >
            {step > 0 && (
              <Link
                href={`/guided-experiences/${slug}/${step}`}
                className={styles.prevBtn}
              >
                <Icon name="chevron-left" />
                <span>{t("guides.entry.navigation.previous")}</span>
              </Link>
            )}
            {step + 1 < total ? (
              <Link
                href={`/guided-experiences/${slug}/${step + 2}`}
                className={styles.nextBtn}
              >
                <span>{t("guides.entry.navigation.next")}</span>
                <Icon name="chevron-right" />
              </Link>
            ) : (
              <Link href="/guided-experiences" className={styles.nextBtn}>
                <span>{t("ui.finish")}</span>
              </Link>
            )}
          </nav>
        </footer>
      </div>
    </section>
  );
}
