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

const ResultList: FunctionComponent<{
  results: Array<OrbitElements>;
  categoryColors: Map<string, string>;
  onSelect: (id: string) => void;
  labelledBy: string;
  locale: string;
}> = ({ results, categoryColors, onSelect, labelledBy, locale }) => {
  const { t } = useClientTranslation(locale);

  return (
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
            <span className={styles.designation}>
              {element.fulldesignation}
            </span>
            {/* Semi-major axis is negative for an unbound orbit, so it is not
              a distance. The object detail makes the same substitution. */}
            <span
              className={styles.distance}
              title={t(
                element.e < 1
                  ? "object.sun_graph.title"
                  : "object.perihelion_distance"
              )}
            >
              {(element.e < 1 ? element.a : element.q).toFixed(2)} AU
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
};

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
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search.placeholder")}
          autoComplete="off"
          aria-describedby={resultsId}
        />

        <div className={styles.inputActions}>
          {offerCatalogue ? (
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
          locale={locale}
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
