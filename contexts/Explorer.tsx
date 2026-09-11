"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type FunctionComponent,
  type PropsWithChildren,
} from "react";
import type { ClassificationRange } from "@/lib/api/hasura";
import type { getSolarElements, getCategories } from "@/lib/api/craft";
import type { PlanetOrbitElements } from "@/lib/static/planetOrbits";
import {
  serializeExplorerParams,
  type ExplorerParams,
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

interface ExplorerData {
  elements: Array<SolarElement>;
  categories: Array<Category>;
  classificationRanges: Array<ClassificationRange>;
  planets: Array<PlanetOrbitElements>;
  dwarfPlanets: Array<PlanetOrbitElements>;
}

interface ExplorerContextValue extends ExplorerData {
  params: ExplorerParams;
  setParams: (next: Partial<ExplorerParams>) => void;
  openObject: (elementId: string) => void;
  closeObject: () => void;
}

const ExplorerContext = createContext<ExplorerContextValue | null>(null);

interface ExplorerProviderProps extends ExplorerData {
  initialParams: ExplorerParams;
}

const ExplorerProvider: FunctionComponent<
  PropsWithChildren<ExplorerProviderProps>
> = ({ children, initialParams, ...data }) => {
  const [params, setParamsState] = useState<ExplorerParams>(initialParams);

  /**
   * Writes view state to the URL with the History API rather than
   * router.replace(). A router navigation re-renders the server component
   * tree, which would tear down and remount the WebGL canvas on every panel
   * toggle or camera move. history.replaceState keeps the scene alive while
   * still updating useSearchParams() for anything reading it.
   */
  const setParams = useCallback((next: Partial<ExplorerParams>) => {
    setParamsState((current) => {
      const merged = { ...current, ...next };
      const query = serializeExplorerParams(merged);

      if (typeof window !== "undefined") {
        const url = query
          ? `${window.location.pathname}?${query}`
          : window.location.pathname;
        window.history.replaceState(null, "", url);
      }

      return merged;
    });
  }, []);

  const openObject = useCallback(
    (elementId: string) => setParams({ object: elementId.toLowerCase() }),
    [setParams]
  );

  const closeObject = useCallback(
    () => setParams({ object: undefined }),
    [setParams]
  );

  const value = useMemo<ExplorerContextValue>(
    () => ({ ...data, params, setParams, openObject, closeObject }),
    [data, params, setParams, openObject, closeObject]
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
