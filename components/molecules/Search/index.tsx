"use client";

import { useId, type FunctionComponent } from "react";
import Button from "@rubin-epo/epo-react-lib/Button";
import useClientTranslation from "@/lib/i18n/client";
import Icon from "@/components/atoms/Icon";
import { useExplorer } from "@/contexts/Explorer";
import { useSearch, MIN_QUERY_LENGTH } from "@/contexts/Search";
import { categoryColorMap } from "@/lib/solar/categoryColors";
import type { OrbitElements } from "@/lib/solar/types";
import styles from "./styles.module.css";

/**
 * Object search panel.
 *
 * Ported from `layers/Search.ts` and `partials/search.njk`. Local matches
 * appear as you type; the full catalogue is only queried when asked, since
 * that is a round trip against millions of rows.
 *
 * Selecting a result opens it in the object detail, which is the same
 * `object` search param the legacy's /object/?id= route carried.
 */

const ResultList: FunctionComponent<{
  results: Array<OrbitElements>;
  categoryColors: Map<string, string>;
  onSelect: (id: string) => void;
  labelledBy: string;
}> = ({ results, categoryColors, onSelect, labelledBy }) => (
  <ul className={styles.results} aria-labelledby={labelledBy}>
    {results.map((element) => (
      <li key={element.id}>
        <button
          type="button"
          className={styles.result}
          onClick={() => onSelect(element.id)}
        >
          <span
            className={styles.swatch}
            style={{
              backgroundColor: categoryColors.get(element.category) ?? "#999",
            }}
            aria-hidden="true"
          />
          <span className={styles.designation}>{element.fulldesignation}</span>
          <span className={styles.distance}>{element.a.toFixed(2)} AU</span>
        </button>
      </li>
    ))}
  </ul>
);

const Search: FunctionComponent<{ locale: string }> = ({ locale }) => {
  const { t } = useClientTranslation(locale);
  const { openObject, categories } = useExplorer();
  const {
    query,
    setQuery,
    localResults,
    catalogueResults,
    searching,
    error,
    runCatalogueSearch,
  } = useSearch();

  const inputId = useId();
  const resultsId = useId();

  const categoryColors = categoryColorMap(categories);

  const tooShort = query.trim().length < MIN_QUERY_LENGTH;
  const results = catalogueResults ?? localResults;
  const showEmpty = !tooShort && results.length === 0 && !searching;

  /**
   * The catalogue is offered only once the local tier has come up empty,
   * which is how the legacy gates it -- `.cloud_search` is `aria-hidden`
   * until the local search returns nothing, and the `not_found_local`
   * banner appears with it. Offering it alongside a full list of local
   * matches would invite a round trip against millions of rows that the
   * reader almost never needs.
   */
  const offerCatalogue = showEmpty && !catalogueResults;

  return (
    <div className={styles.search}>
      <label className={styles.label} htmlFor={inputId}>
        {t("search.title")}
      </label>

      <div className={styles.inputWrap}>
        <input
          id={inputId}
          className={styles.input}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search.placeholder")}
          autoComplete="off"
          // Results appear below as you type; announce them politely rather
          // than hijacking focus.
          aria-describedby={resultsId}
        />

        {/* The legacy's `.input-actions`: the magnifier and the cloud-search
            button share one slot at the end of the field and swap, rather
            than both being on screen at once. */}
        <div className={styles.inputActions}>
          {offerCatalogue ? (
            /* `primary`, not `secondary`: epo-react-lib's secondary is red,
               and its primary is `#12726d` -- the same fill the legacy's own
               `.button.primary` uses here. */
            <Button
              styleAs="primary"
              type="button"
              onClick={runCatalogueSearch}
              disabled={searching}
            >
              {t("search.search_cloud")}
            </Button>
          ) : (
            <Icon name="search" className={styles.inputIcon} />
          )}
        </div>
      </div>

      <p
        className={styles.status}
        id={resultsId}
        role="status"
        aria-live="polite"
      >
        {tooShort
          ? t("search.hint", { count: MIN_QUERY_LENGTH })
          : searching
            ? t("core.loading")
            : `${results.length}${catalogueResults ? "" : "+"} ${t("core.objects")}`}
      </p>

      {results.length > 0 && (
        <ResultList
          results={results}
          categoryColors={categoryColors}
          onSelect={openObject}
          labelledBy={resultsId}
        />
      )}

      {showEmpty && (
        <p className={styles.empty}>{t("search.not_found", { query })}</p>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default Search;
