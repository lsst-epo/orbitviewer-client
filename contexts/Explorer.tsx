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
  serializeExplorerParams,
  type ExplorerParams,
  type ExplorerPanel,
} from "@/lib/explorer/searchParams";

/**
 * Owns everything the explorer's panels and the 3D scene share: the object
 * catalogue from Craft, the orbital data, and the URL-backed view state.
 *
 * Mirrors the rubin-obs-client SummitData pattern -- fetch on the server,
 * hand the result to a provider, consume it from components -- and replaces
 * the legacy singleton `LoadManager` / `GLOBALS` objects.
 */

// Derived from the query functions so they track the generated schema types.
// Craft unions yield nullable members, which the consumers narrow.
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

interface ExplorerProviderProps extends ExplorerData {
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
   * Mirrors view state into the URL with the History API rather than
   * router.replace(). A router navigation re-renders the server component
   * tree, which would tear down and remount the WebGL canvas on every panel
   * toggle or camera move. history.replaceState keeps the scene alive while
   * still updating useSearchParams() for anything reading it.
   *
   * In an effect, not inside the state updater: React may run an updater
   * during render, and replaceState there makes the router set state mid-
   * render ("Cannot update a component while rendering a different
   * component"). An effect also collapses several updates in one commit into
   * a single history write.
   */
  useEffect(() => {
    const query = serializeExplorerParams(params);
    const url = query
      ? `${window.location.pathname}?${query}`
      : window.location.pathname;

    if (url !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, "", url);
    }
  }, [params]);

  const openObject = useCallback(
    // Passed through verbatim: see the note on ExplorerParamsSchema.object.
    (elementId: string) => setParams({ object: elementId }),
    [setParams]
  );

  const closeObject = useCallback(
    () => setParams({ object: undefined }),
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

  /**
   * `types` lists the categories that are ON, and its absence means all of
   * them -- the inverse of the legacy `ntypes`, which listed the ones that
   * were off. Listing the inclusions means an unrecognised slug in a share
   * link drops one category rather than silently enabling it.
   */
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

      // All on is the default, so it serialises as no param at all.
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
