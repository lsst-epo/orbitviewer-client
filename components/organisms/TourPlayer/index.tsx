"use client";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useExplorer } from "@/contexts/ExplorerProvider";
import { Link } from "@/lib/i18n/navigation";
import styles from "./styles.module.css";
export function TourPlayer({
  title,
  slug,
  step,
  total,
  target,
  children,
}: {
  title: string;
  slug: string;
  step: number;
  total: number;
  target?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const { select } = useExplorer();
  useEffect(() => {
    select(target);
  }, [target, select]);
  return (
    <section className={styles.player} aria-label={title}>
      <Link href="/guided-experiences">← {t("ui.back")}</Link>
      <p>
        {title} · {step + 1} / {total}
      </p>
      <div className={styles.content}>{children}</div>
      <nav aria-label={t("wizard.button_group.aria")}>
        {step > 0 && (
          <Link href={`/guided-experiences/${slug}/${step}`}>
            {t("guides.entry.navigation.previous")}
          </Link>
        )}
        {step + 1 < total ? (
          <Link href={`/guided-experiences/${slug}/${step + 2}`}>
            {t("guides.entry.navigation.next")} →
          </Link>
        ) : (
          <Link href="/guided-experiences">{t("ui.finish")}</Link>
        )}
      </nav>
    </section>
  );
}
