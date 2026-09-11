"use client";
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import type { OrbitRecord } from "@/lib/api/hasura";
import type { SolarEntry } from "@/lib/api/craft";
import type { CameraView } from "@/lib/solar/view";
import { categories } from "@/lib/solar/categories";
import { dateToMjd, objectId } from "@/lib/solar/orbits";

function useExplorerState(initial: OrbitRecord[], entries: SolarEntry[]) {
  const params = useSearchParams();
  const cameraViewRef = useRef<CameraView | null>(null);
  const [extras, setExtras] = useState<OrbitRecord[]>([]);
  const [catalog, setCatalog] = useState<OrbitRecord[]>([]);
  const records = useMemo(
    () =>
      Array.from(
        new Map(
          [...initial, ...catalog, ...extras].map((record) => [
            objectId(record),
            record,
          ]),
        ).values(),
      ),
    [initial, catalog, extras],
  );
  const [enabled, setEnabled] = useState<number[]>(
    categories.map(({ code }) => code),
  );
  const [discoverer, setDiscoverer] = useState("all");
  const [distance, setDistance] = useState(500);
  const [mjd, setMjd] = useState(() => {
    const shared = Number(params.get("mjd"));
    return Number.isFinite(shared) && shared >= 15020 && shared <= 88069
      ? shared
      : dateToMjd(new Date());
  });
  const [speed, setSpeed] = useState(0);
  const [showOrbits, setShowOrbits] = useState(true);
  const [quality, setQuality] = useState("low");
  const [cameraAction, setCameraAction] = useState({
    action: "reset",
    revision: 0,
  });
  const selectedId = params.get("target");
  const selected = records.find(
    (record) =>
      objectId(record) === selectedId || record.fulldesignation === selectedId,
  );
  const select = useCallback((id?: string) => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("target") !== (id ?? null)) {
      ["x", "y", "z", "tx", "ty", "tz"].forEach((key) => query.delete(key));
    }
    if (id) query.set("target", id);
    else query.delete("target");
    window.history.pushState(
      null,
      "",
      `${window.location.pathname}${query.size ? `?${query}` : ""}`,
    );
  }, []);
  useEffect(() => {
    if (!speed) return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const elapsed = Math.min((now - last) / 1000, 0.25);
      last = now;
      setMjd((value) =>
        Math.min(88069, Math.max(15020, value + speed * elapsed)),
      );
    }, 50);
    return () => clearInterval(timer);
  }, [speed]);
  const visible = useMemo(
    () =>
      records.filter(
        (record) =>
          (record.object_type ?? [0]).some((code) => enabled.includes(code)) &&
          (discoverer === "all" ||
            Boolean(record.rubin_discovery) === (discoverer === "rubin")) &&
          Math.abs(record.a) <= distance,
      ),
    [records, enabled, discoverer, distance],
  );
  const addRecords = useCallback(
    (items: OrbitRecord[]) =>
      setExtras((current) =>
        Array.from(
          new Map(
            [...current, ...items].map((item) => [objectId(item), item]),
          ).values(),
        ),
      ),
    [],
  );
  useEffect(() => {
    if (!selectedId || selectedId === "sun" || selected) return;
    const controller = new AbortController();
    // Shared links can name an object outside the currently loaded catalog.
    fetch(`/api/search?q=${encodeURIComponent(selectedId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as { results: OrbitRecord[] };
        const match = data.results.find(
          (record) =>
            objectId(record) === selectedId ||
            record.fulldesignation === selectedId,
        );
        if (match && !controller.signal.aborted) addRecords([match]);
      })
      .catch(() => {
        /* The details panel remains usable while search is unavailable. */
      });
    return () => controller.abort();
  }, [selectedId, selected, addRecords]);
  const camera = (action: string) =>
    setCameraAction((value) => ({ action, revision: value.revision + 1 }));
  return {
    records,
    entries,
    addRecords,
    setCatalog,
    visible,
    enabled,
    setEnabled,
    discoverer,
    setDiscoverer,
    distance,
    setDistance,
    mjd,
    setMjd,
    speed,
    setSpeed,
    selectedId,
    selected,
    select,
    showOrbits,
    setShowOrbits,
    quality,
    setQuality,
    cameraAction,
    cameraViewRef,
    camera,
  };
}
type ExplorerState = ReturnType<typeof useExplorerState>;
const ExplorerContext = createContext<ExplorerState | null>(null);
export function ExplorerProvider({
  initial,
  entries,
  children,
}: {
  initial: OrbitRecord[];
  entries: SolarEntry[];
  children: ReactNode;
}) {
  const state = useExplorerState(initial, entries);
  return <ExplorerContext value={state}>{children}</ExplorerContext>;
}
export function useExplorer() {
  const state = useContext(ExplorerContext);
  if (!state) throw new Error("ExplorerProvider is missing");
  return state;
}

export function useOrbitSearch() {
  const { records, entries, addRecords } = useExplorer();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const results = useMemo(
    () =>
      records
        .filter((item) =>
          `${item.fulldesignation} ${item.id ?? ""} ${item.mpcdesignation ?? ""} ${entries.find((entry) => entry.elementID === objectId(item))?.title ?? ""}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .slice(0, 100),
    [records, entries, query],
  );
  async function searchCloud() {
    controller.current?.abort();
    const pending = new AbortController();
    controller.current = pending;
    setBusy(true);
    setError(false);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`,
        { signal: pending.signal },
      );
      if (!response.ok) throw new Error("Search failed");
      const data = (await response.json()) as { results: OrbitRecord[] };
      addRecords(data.results);
    } catch {
      if (!pending.signal.aborted) setError(true);
    } finally {
      if (!pending.signal.aborted) setBusy(false);
    }
  }
  return { query, setQuery, results, busy, error, searchCloud };
}
