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

/**
 * The sortable, searchable tour grid.
 *
 * Ported from `pages/GuidedExperiencesPage.ts`, which did both by mutating
 * the rendered cards rather than the list: it wrote a `--order` custom
 * property onto each card and let flexbox reorder them, and hid non-matching
 * cards with `aria-hidden`.
 *
 * Both are replaced by sorting and filtering the array. The legacy approach
 * left the DOM order -- and so the tab and screen-reader order -- unchanged
 * and disagreeing with what was on screen, and `aria-hidden` on a link
 * removes it from the accessibility tree while leaving it focusable, which
 * strands keyboard users on a control that announces nothing.
 *
 * The legacy also rendered a hard-coded five-item suggestion menu under the
 * search box that was never wired to anything. It is not carried over; the
 * grid filters as you type, which is what it was miming.
 */

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
            type="search"
            placeholder={t("guides.index.search")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Icon name="search" className={styles.fieldIcon} aria-hidden />
        </div>
      </div>

      {/* Announces how the grid changed as the reader types, which the legacy
          left entirely silent. */}
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
