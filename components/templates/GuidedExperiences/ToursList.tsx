"use client";

import { useId, useMemo, useState, type FunctionComponent } from "react";
import useClientTranslation from "@/lib/i18n/client";
import Icon from "@/components/atoms/Icon";
import TourCard from "@/components/molecules/TourCard";
import {
  DEFAULT_SORT,
  SORT_OPTIONS,
  difficultyKey,
  matchesQuery,
  sortTours,
  type TourSummary,
} from "@/lib/tours";
import styles from "./styles.module.css";

const ToursList: FunctionComponent<{
  locale: string;
  tours: Array<TourSummary>;
}> = ({ locale, tours }) => {
  const { t } = useClientTranslation(locale);
  const sortId = useId();
  const searchId = useId();
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () => sortTours(tours, sort).filter((tour) => matchesQuery(tour, query)),
    [tours, sort, query]
  );

  return (
    <>
      <div className={styles.filters}>
        <div className={styles.field}>
          <label className={styles.srOnly} htmlFor={sortId}>
            {t("guides.index.filter.newer")}
          </label>
          <select
            id={sortId}
            className={styles.select}
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
          <Icon name="chevronDown" className={styles.fieldIcon} aria-hidden />
        </div>

        <div className={styles.field}>
          <label className={styles.srOnly} htmlFor={searchId}>
            {t("guides.index.search")}
          </label>
          <input
            id={searchId}
            className={styles.input}
            type="text"
            placeholder={t("guides.index.search")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Icon name="search" className={styles.fieldIcon} aria-hidden />
        </div>
      </div>

      <p className={styles.status} role="status">
        {t("guides.index.count", { count: visible.length })}
      </p>

      {visible.length === 0 && (
        <p className={styles.empty}>{t("guides.index.empty")}</p>
      )}

      <ul className={styles.grid}>
        {visible.map((tour) => (
          <li key={tour.slug}>
            <TourCard
              tour={tour}
              labels={{
                difficulty: t(difficultyKey(tour.complexity)),
                duration: t("guides.index.minutes", {
                  count: tour.duration ?? 0,
                }),
                recommended: t("core.recommended"),
              }}
            />
          </li>
        ))}
      </ul>
    </>
  );
};

export default ToursList;
