"use client";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Tour } from "@/lib/api/craft";
import { Link } from "@/lib/i18n/navigation";
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
      <h1>{t("guides.index.title")}</h1>
      <p>{t("guides.index.subtitle")}</p>
      <div className={styles.controls}>
        <input
          aria-label={t("guides.index.search")}
          placeholder={t("guides.index.search")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
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
      </div>
      {!visible.length && <p>{t("ui.noTours")}</p>}
      <div className={styles.grid}>
        {visible.map((tour) => (
          <Link
            className={styles.card}
            key={tour.slug}
            href={`/guided-experiences/${tour.slug}`}
          >
            {tour.tourPreview?.[0]?.url && (
              <CmsImage src={tour.tourPreview[0].url} alt="" />
            )}
            <div>
              <span>{tour.duration} min</span>
              <h2>{tour.title}</h2>
              <p>{tour.tourPicker?.map(({ title }) => title).join(" · ")}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
