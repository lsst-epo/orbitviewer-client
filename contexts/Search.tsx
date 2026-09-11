"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FunctionComponent,
  type PropsWithChildren,
} from "react";
import type { OrbitElements } from "@/lib/solar/types";
import { matchesFilters, type ObjectFilters } from "@/lib/solar/filters";
import { useSolarData } from "@/contexts/SolarData";

/**
 * Two-tier object search.
 *
 * Ported from `core/data/SearchEngine.ts`, `layers/Search.ts` and the web
 * worker in `assets/js/search.js`.
 *
 * Tier one is local: the dataset is already downloaded for the scene, so a
 * substring match over it is instant and needs no network. The legacy ran
 * this in a web worker; that is not carried over, because the work is a
 * single pass of `String.includes` over an array already in memory and the
 * worker's own postMessage structured-clone of that array costs more than
 * the search does.
 *
 * Tier two queries the full catalogue through /api/search, and is only run
 * when the user explicitly asks -- it is a round trip against millions of
 * rows, not something to fire on every keystroke.
 */

/** Below this, searching is not useful and the catalogue query is refused. */
export const MIN_QUERY_LENGTH = 2;
/** Local results are capped; the list is for picking from, not browsing. */
const LOCAL_RESULT_LIMIT = 100;
const DEBOUNCE_MS = 150;

interface SearchValue {
  query: string;
  setQuery: (query: string) => void;
  /** Matches from the already-downloaded dataset. */
  localResults: Array<OrbitElements>;
  /** Matches from the full catalogue, after runCatalogueSearch. */
  catalogueResults: Array<OrbitElements> | null;
  searching: boolean;
  error: string | null;
  runCatalogueSearch: () => void;
  clear: () => void;
}

const SearchContext = createContext<SearchValue | null>(null);

interface SearchProviderProps {
  /** Applied to results so search cannot surface a hidden object. */
  filters: ObjectFilters;
  /** Bodies not present in the MPC dataset, e.g. planets. */
  additionalElements?: Array<OrbitElements>;
}

const SearchProvider: FunctionComponent<
  PropsWithChildren<SearchProviderProps>
> = ({ children, filters, additionalElements = [] }) => {
  const { elements } = useSolarData();

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [catalogueResults, setCatalogueResults] =
    useState<Array<OrbitElements> | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // Debounced so typing does not re-scan the dataset on every keystroke.
  useEffect(() => {
    const id = setTimeout(
      () => setDebounced(query.trim().toLowerCase()),
      DEBOUNCE_MS
    );
    return () => clearTimeout(id);
  }, [query]);

  // A new query invalidates any catalogue results already on screen.
  useEffect(() => {
    setCatalogueResults(null);
    setError(null);
  }, [debounced]);

  const localResults = useMemo(() => {
    if (debounced.length < MIN_QUERY_LENGTH) return [];

    const matches: Array<OrbitElements> = [];

    for (const element of [...additionalElements, ...elements]) {
      if (matches.length >= LOCAL_RESULT_LIMIT) break;
      if (!element.fulldesignation?.toLowerCase().includes(debounced)) continue;
      if (!matchesFilters(element, filters)) continue;
      matches.push(element);
    }

    return matches;
  }, [debounced, elements, additionalElements, filters]);

  const runCatalogueSearch = useCallback(() => {
    if (debounced.length < MIN_QUERY_LENGTH) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSearching(true);
    setError(null);

    const params = new URLSearchParams({ q: debounced });
    if (filters.rubinOnly !== undefined) {
      params.set("discovery", filters.rubinOnly ? "rubin" : "other");
    }
    if (filters.categories?.size) {
      params.set("types", [...filters.categories].join(","));
    }

    fetch(`/api/search?${params}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data: { results: Array<OrbitElements>; message?: string }) => {
        // Distance is not expressible in the Hasura query, so it is applied
        // to the response for consistency with the local tier.
        setCatalogueResults(
          (data.results ?? []).filter((element) =>
            matchesFilters(element, filters)
          )
        );
        if (data.message) setError(data.message);
        setSearching(false);
      })
      .catch((cause: Error) => {
        if (cause.name === "AbortError") return;
        console.error(cause);
        setError("Search is unavailable");
        setSearching(false);
      });
  }, [debounced, filters]);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setQuery("");
    setCatalogueResults(null);
    setError(null);
    setSearching(false);
  }, []);

  // Abandon an in-flight request if the panel goes away mid-search.
  useEffect(() => () => abortRef.current?.abort(), []);

  const value = useMemo<SearchValue>(
    () => ({
      query,
      setQuery,
      localResults,
      catalogueResults,
      searching,
      error,
      runCatalogueSearch,
      clear,
    }),
    [
      query,
      localResults,
      catalogueResults,
      searching,
      error,
      runCatalogueSearch,
      clear,
    ]
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
};

export const useSearch = (): SearchValue => {
  const context = useContext(SearchContext);

  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }

  return context;
};

export default SearchProvider;
