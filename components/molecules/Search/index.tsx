"use client";

import { useId, type FunctionComponent } from "react";
import Button from "@rubin-epo/epo-react-lib/Button";
import useClientTranslation from "@/lib/i18n/client";
import Icon from "@/components/atoms/Icon";
import { useExplorer } from "@/contexts/Explorer";
import { useSearch, MIN_QUERY_LENGTH } from "@/contexts/Search";
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

  const categoryColors = new Map(
    categories.flatMap((category) =>
      category && "slug" in category && category.slug && category.mainColor
        ? [[category.slug, category.mainColor] as const]
        : []
    )
  );

  const tooShort = query.trim().length < MIN_QUERY_LENGTH;
  const results = catalogueResults ?? localResults;
  const showEmpty = !tooShort && results.length === 0 && !searching;

  return (
    <div className={styles.search}>
      <label className={styles.label} htmlFor={inputId}>
        {t("search.title")}
      </label>

      <div className={styles.inputWrap}>
        <Icon name="search" className={styles.inputIcon} />
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
      </div>

      <p
        className={styles.status}
        id={resultsId}
        role="status"
        aria-live="polite"
      >
        {tooShort
          ? t("search.hint", {
              defaultValue: `Type at least ${MIN_QUERY_LENGTH} characters`,
            })
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

      {showEmpty && <p className={styles.empty}>{t("search.notFound")}</p>}

      {error && <p className={styles.error}>{error}</p>}

      {/* The local tier only covers what has been downloaded for the scene,
          so the full catalogue stays one deliberate click away. */}
      {!tooShort && !catalogueResults && (
        <Button
          styleAs="secondary"
          type="button"
          onClick={runCatalogueSearch}
          isInactive={searching}
        >
          {t("search.cloud", { defaultValue: "Search the full catalogue" })}
        </Button>
      )}
    </div>
  );
};

export default Search;
