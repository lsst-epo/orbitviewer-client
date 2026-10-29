"use client";

import { useCallback, useEffect, useId, type FunctionComponent } from "react";
import clsx from "clsx/lite";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import useClientTranslation from "@/lib/i18n/client";
import { useExplorer } from "@/contexts/Explorer";
import Icon from "@/components/atoms/Icon";
import { closeUpId, slidesOf, type Tour } from "@/lib/tours";
import SlideBody from "./Slide";
import styles from "./styles.module.css";

export interface TourPlayerProps {
  locale: string;
  tour: Tour;
  /** 1-based, already clamped by the route. */
  slide: number;
}

const TourPlayer: FunctionComponent<TourPlayerProps> = ({
  locale,
  tour,
  slide,
}) => {
  const { t } = useClientTranslation(locale);
  const { openObject, closeObject } = useExplorer();
  const router = useRouter();
  const pathname = usePathname();
  const titleId = useId();

  const slides = slidesOf(tour);
  const index = slide - 1;
  const current = slides[index];
  const total = slides.length;

  const focusId = current ? closeUpId(current) : undefined;

  useEffect(() => {
    if (focusId) openObject(focusId);
    else closeObject();
  }, [focusId, openObject, closeObject]);

  const go = useCallback(
    (next: number) => {
      if (next < 1 || next > total) return;

      router.push(next === 1 ? pathname : `${pathname}?slide=${next}`, {
        scroll: false,
      });
    },
    [router, pathname, total]
  );

  if (!current) return null;

  const progress = total > 1 ? index / (total - 1) : 1;

  return (
    <section
      className={styles.player}
      aria-labelledby={titleId}
      aria-label={tour.title ?? undefined}
    >
      <div className={styles.card}>
        <header className={styles.head}>
          <h2 className={styles.title} id={titleId}>
            {tour.title}
          </h2>

          <p className={styles.steps} role="status">
            {t("guides.entry.step", { current: slide, total })}
          </p>

          <div className={styles.progress} aria-hidden>
            <span
              className={styles.progressValue}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </header>

        <SlideBody
          slide={current}
          preview={tour.tourPreview?.[0] ?? undefined}
          showPreview={index === 0}
          funFactLabel={t("guides.entry.fun_fact")}
        />

        <footer className={styles.foot}>
          <Link className={styles.exit} href="/guided-experiences">
            <Icon name="chevronLeft" aria-hidden />
            <span>{t("guides.entry.navigation.guides")}</span>
          </Link>

          <div className={styles.nav}>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => go(slide - 1)}
              disabled={slide <= 1}
            >
              <Icon name="chevronLeft" aria-hidden />
              <span>{t("guides.entry.navigation.previous")}</span>
            </button>

            <button
              type="button"
              className={clsx(styles.primary)}
              onClick={() => go(slide + 1)}
              disabled={slide >= total}
            >
              <span>{t("guides.entry.navigation.next")}</span>
              <Icon name="chevronRight" aria-hidden />
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
};

export default TourPlayer;
