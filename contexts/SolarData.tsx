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
import type { OrbitElements } from "@/lib/solar/types";
import {
  DEFAULT_QUALITY,
  QUALITY_STORAGE_KEY,
  isSimQuality,
  type SimQuality,
} from "@/lib/solar/quality";
import { datasetUrlFor, loadMpcDataset } from "@/lib/api/mpcData";

interface SolarDataValue {
  /** The tier the reader has chosen. Changes the moment they choose it. */
  quality: SimQuality;
  setQuality: (quality: SimQuality) => void;
  elements: Array<OrbitElements>;
  /**
   * The tier `elements` was loaded for, or null before the first load. Lags
   * `quality` while a download is in flight -- see README.
   */
  datasetQuality: SimQuality | null;
  rubinDiscoveryCount: number;
  loading: boolean;
  /** 0-1 while downloading, when the server advertises a length. */
  progress: number;
  error: Error | null;
}

const SolarDataContext = createContext<SolarDataValue | null>(null);

interface SolarDataProviderProps {
  /** Quality tier to dataset URL, from Craft's mpcDataFiles entries. */
  dataFileUrls: Record<string, string>;
  initialQuality?: SimQuality;
}

const SolarDataProvider: FunctionComponent<
  PropsWithChildren<SolarDataProviderProps>
> = ({ children, dataFileUrls, initialQuality }) => {
  const [quality, setQualityState] = useState<SimQuality>(
    initialQuality ?? DEFAULT_QUALITY
  );
  const [elements, setElements] = useState<Array<OrbitElements>>([]);
  const [datasetQuality, setDatasetQuality] = useState<SimQuality | null>(null);
  const [rubinDiscoveryCount, setRubinDiscoveryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  // Restore the persisted tier after mount: reading localStorage during
  // render would desync server and client markup.
  useEffect(() => {
    if (initialQuality) return;

    try {
      const stored = window.localStorage.getItem(QUALITY_STORAGE_KEY);
      if (stored && isSimQuality(stored)) setQualityState(stored);
    } catch {
      // Private browsing, or storage disabled. The default tier is fine.
    }
  }, [initialQuality]);

  const setQuality = useCallback((next: SimQuality) => {
    setQualityState(next);
    try {
      window.localStorage.setItem(QUALITY_STORAGE_KEY, next);
    } catch {
      // Non-fatal; the choice just will not persist.
    }
  }, []);

  useEffect(() => {
    const url = datasetUrlFor(dataFileUrls, quality);

    if (!url) {
      setError(new Error("No MPC dataset URL configured"));
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    setLoading(true);
    setProgress(0);
    setError(null);

    loadMpcDataset(url, {
      signal: controller.signal,
      onProgress: setProgress,
    })
      .then((dataset) => {
        // A download that completed after it was abandoned must not land
        // over the newer tier's data.
        if (controller.signal.aborted) return;

        setElements(dataset.elements);
        setDatasetQuality(quality);
        setRubinDiscoveryCount(dataset.rubinDiscoveryCount);
        setLoading(false);
      })
      .catch((cause: Error) => {
        if (cause.name === "AbortError") return;
        console.error(cause);
        setError(cause);
        setLoading(false);
      });

    return () => controller.abort();
  }, [dataFileUrls, quality]);

  const value = useMemo<SolarDataValue>(
    () => ({
      quality,
      setQuality,
      elements,
      datasetQuality,
      rubinDiscoveryCount,
      loading,
      progress,
      error,
    }),
    [
      quality,
      setQuality,
      elements,
      datasetQuality,
      rubinDiscoveryCount,
      loading,
      progress,
      error,
    ]
  );

  return (
    <SolarDataContext.Provider value={value}>
      {children}
    </SolarDataContext.Provider>
  );
};

export const useSolarData = (): SolarDataValue => {
  const context = useContext(SolarDataContext);

  if (!context) {
    throw new Error("useSolarData must be used within a SolarDataProvider");
  }

  return context;
};

export default SolarDataProvider;
