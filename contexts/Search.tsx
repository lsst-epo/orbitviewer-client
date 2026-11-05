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

/** Below this, searching is not useful and the catalogue query is refused. */
export const MIN_QUERY_LENGTH = 2;
/** Local results are capped; the list is for picking from, not browsing. */
const LOCAL_RESULT_LIMIT = 100;
const DEBOUNCE_MS = 150;

// to-do: Determine if this should be a key to display bespoke error messages or changed to a boolean if there is only ever going to be one error message
/** Error states the panel renders; the copy for each lives in the catalog. */
export type SearchError = "unavailable";

interface SearchValue {
  query: string;
  setQuery: (query: string) => void;
  /** Matches from the already-downloaded dataset. */
  localResults: Array<OrbitElements>;
  /** Matches from the full catalogue, after runCatalogueSearch. */
  catalogueResults: Array<OrbitElements> | null;
  searching: boolean;
  error: SearchError | null;
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
  const [error, setError] = useState<SearchError | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const id = setTimeout(
      () => setDebounced(query.trim().toLowerCase()),
      DEBOUNCE_MS
    );
    return () => clearTimeout(id);
  }, [query]);

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

  /* Reads `query` rather than `debounced`: the debounce paces local matching
     as the reader types, but this runs on an explicit press and must search
     what is in the field at that moment, not what it held 150ms ago. */
  const runCatalogueSearch = useCallback(() => {
    const term = query.trim().toLowerCase();

    if (term.length < MIN_QUERY_LENGTH) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSearching(true);
    setError(null);

    const params = new URLSearchParams({ q: term });
    if (filters.rubinOnly !== undefined) {
      params.set("discovery", filters.rubinOnly ? "rubin" : "other");
    }
    if (filters.categories?.size) {
      params.set("types", [...filters.categories].join(","));
    }

    fetch(`/api/search?${params}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok)
          throw new Error(`Search responded ${response.status}`);
        return response.json() as Promise<{ results: Array<OrbitElements> }>;
      })
      .then((data) => {
        setCatalogueResults(
          (data.results ?? []).filter((element) =>
            matchesFilters(element, filters)
          )
        );
        setSearching(false);
      })
      .catch((cause: Error) => {
        if (cause.name === "AbortError") return;
        console.error(cause);
        setError("unavailable");
        setSearching(false);
      });
  }, [query, filters]);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setQuery("");
    setCatalogueResults(null);
    setError(null);
    setSearching(false);
  }, []);

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
