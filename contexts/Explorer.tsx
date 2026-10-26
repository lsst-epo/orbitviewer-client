"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FunctionComponent,
  type PropsWithChildren,
} from "react";
import type { ClassificationRange } from "@/lib/api/hasura";
import type { getSolarElements, getCategories } from "@/lib/api/craft";
import type { PlanetOrbitElements } from "@/lib/static/planetOrbits";
import { ALL_CATEGORIES } from "@/lib/solar/categoryLabels";
import type { SolarCategory } from "@/lib/solar/types";
import {
  mergeExplorerParams,
  type ExplorerParams,
  type ExplorerPanel,
} from "@/lib/explorer/searchParams";

export type SolarElement = Awaited<ReturnType<typeof getSolarElements>>[number];
export type Category = Awaited<ReturnType<typeof getCategories>>[number];

/**
 * The union member that actually carries content.
 *
 * `entries` is typed as a union across every section, so consumers have to
 * narrow before reading `elementID`. `.filter()` alone does not narrow a
 * union, hence the explicit predicate.
 */
export type SolarElementEntry = Extract<
  NonNullable<SolarElement>,
  { elementID?: string | null }
>;

export const solarElementEntries = (
  elements: Array<SolarElement>
): Array<SolarElementEntry> =>
  elements.filter(
    (entry): entry is SolarElementEntry =>
      entry !== null && "elementID" in entry
  );

interface ExplorerData {
  elements: Array<SolarElement>;
  categories: Array<Category>;
  classificationRanges: Array<ClassificationRange>;
  planets: Array<PlanetOrbitElements>;
  dwarfPlanets: Array<PlanetOrbitElements>;
  /** Quality tier to MPC dataset URL, from Craft's mpcDataFiles entries. */
  dataFileUrls: Record<string, string>;
}

interface ExplorerContextValue extends ExplorerData {
  params: ExplorerParams;
  setParams: (next: Partial<ExplorerParams>) => void;
  openObject: (elementId: string) => void;
  closeObject: () => void;
  /** Opens a panel, or closes it if it is already the open one. */
  togglePanel: (panel: ExplorerPanel) => void;
  closePanel: () => void;
  /** Categories currently switched on. */
  visibleCategories: Set<SolarCategory>;
  toggleCategory: (category: SolarCategory) => void;
}

const ExplorerContext = createContext<ExplorerContextValue | null>(null);

export interface ExplorerProviderProps extends ExplorerData {
  initialParams: ExplorerParams;
}

const ExplorerProvider: FunctionComponent<
  PropsWithChildren<ExplorerProviderProps>
> = ({ children, initialParams, ...data }) => {
  const [params, setParamsState] = useState<ExplorerParams>(initialParams);

  const setParams = useCallback((next: Partial<ExplorerParams>) => {
    setParamsState((current) => ({ ...current, ...next }));
  }, []);

  /**
   * Mirrors view state into the URL: History API not router.replace(), in an
   * effect not an updater, merged not overwritten. All three matter -- README.
   */
  useEffect(() => {
    const query = mergeExplorerParams(window.location.search, params);
    const url = query
      ? `${window.location.pathname}?${query}`
      : window.location.pathname;

    if (url !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, "", url);
    }
  }, [params]);

  const openObject = useCallback(
    (elementId: string) => setParams({ object: elementId }),
    [setParams]
  );

  const closeObject = useCallback(
    () => setParams({ object: undefined, view: undefined }),
    [setParams]
  );

  const togglePanel = useCallback(
    (panel: ExplorerPanel) =>
      setParams({ panel: params.panel === panel ? undefined : panel }),
    [setParams, params.panel]
  );

  const closePanel = useCallback(
    () => setParams({ panel: undefined }),
    [setParams]
  );

  /** `types` lists the categories that are ON -- see README. */
  const visibleCategories = useMemo(() => {
    if (!params.types) return new Set(ALL_CATEGORIES);

    const requested = new Set(params.types);
    return new Set(
      ALL_CATEGORIES.filter((category) => requested.has(category))
    );
  }, [params.types]);

  const toggleCategory = useCallback(
    (category: SolarCategory) => {
      const next = new Set(visibleCategories);
      if (next.has(category)) next.delete(category);
      else next.add(category);

      setParams({
        types:
          next.size === ALL_CATEGORIES.length
            ? undefined
            : ALL_CATEGORIES.filter((slug) => next.has(slug)),
      });
    },
    [setParams, visibleCategories]
  );

  const value = useMemo<ExplorerContextValue>(
    () => ({
      ...data,
      params,
      setParams,
      openObject,
      closeObject,
      togglePanel,
      closePanel,
      visibleCategories,
      toggleCategory,
    }),
    [
      data,
      params,
      setParams,
      openObject,
      closeObject,
      togglePanel,
      closePanel,
      visibleCategories,
      toggleCategory,
    ]
  );

  return (
    <ExplorerContext.Provider value={value}>
      {children}
    </ExplorerContext.Provider>
  );
};

export const useExplorer = (): ExplorerContextValue => {
  const context = useContext(ExplorerContext);

  if (!context) {
    throw new Error("useExplorer must be used within an ExplorerProvider");
  }

  return context;
};

export default ExplorerProvider;
