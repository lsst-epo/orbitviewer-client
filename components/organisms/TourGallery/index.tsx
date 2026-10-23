"use client";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Tour } from "@/lib/api/craft";
import { Link } from "@/lib/i18n/navigation";
import { Icon } from "@/components/atoms/Icon";
import { CmsImage } from "@/components/atoms/CmsImage";
import styles from "./styles.module.css";
export function TourGallery({ tours }: { tours: Tour[] }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newer");
  const visible = useMemo(
    () =>
      tours
        .filter((tour) =>
          tour.title.toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) => {
          if (sort === "less_duration") return a.duration - b.duration;
          if (sort === "more_duration") return b.duration - a.duration;
          if (sort === "less_complex") return a.complexity - b.complexity;
          if (sort === "more_complex") return b.complexity - a.complexity;
          return (
            (Date.parse(b.postDate) - Date.parse(a.postDate)) *
            (sort === "older" ? -1 : 1)
          );
        }),
    [tours, query, sort],
  );
  return (
    <main className={styles.gallery}>
      <div className={styles.actions}>
        <Link className={styles.back} href="/explorer">
          <Icon name="chevron-left" />
          <span>{t("guides.index.close")}</span>
        </Link>
      </div>
      <div className={styles.body}>
        <div className={styles.head}>
          <div className={styles.heading}>
            <h1>{t("guides.index.title")}</h1>
            <p>{t("guides.index.subtitle")}</p>
          </div>
          <div className={styles.controls}>
            <div className={styles.selectWrap}>
              <select
                aria-label={t("toolbar.filters")}
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                {[
                  "newer",
                  "older",
                  "less_duration",
                  "more_duration",
                  "less_complex",
                  "more_complex",
                ].map((value) => (
                  <option value={value} key={value}>
                    {t(`guides.index.filter.${value}`)}
                  </option>
                ))}
              </select>
              <Icon name="chevron-down" />
            </div>
            <div className={styles.search}>
              <input
                aria-label={t("guides.index.search")}
                placeholder={t("guides.index.search")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <Icon name="search" />
            </div>
          </div>
        </div>
        {!visible.length && <p>{t("ui.noTours")}</p>}
        <div className={styles.grid}>
          {visible.map((tour) => (
            <Link
              className={styles.card}
              key={tour.slug}
              href={`/guided-experiences/${tour.slug}`}
            >
              <div className={styles.hero}>
                {tour.tourPreview?.[0]?.url && (
                  <CmsImage src={tour.tourPreview[0].url} alt="" />
                )}
                {tour.featuredTour && (
                  <span className={styles.ribbon}>
                    {t("guides.recommended")}
                  </span>
                )}
              </div>
              <div className={styles.text}>
                <div className={styles.meta}>
                  <span className={styles.chipPrimary}>
                    {t(
                      `guides.difficulty.${tour.complexity < 3 ? "easy" : tour.complexity < 5 ? "medium" : "hard"}`,
                    )}
                  </span>
                  <span className={styles.chipDefault}>
                    {tour.duration} {t("guides.duration")}
                  </span>
                </div>
                <h2>{tour.title}</h2>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
