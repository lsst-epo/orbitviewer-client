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
import type { SolarEntry, Category } from "@/lib/api/craft";
import type { CameraView } from "@/lib/solar/view";
import { categories, categoryCode } from "@/lib/solar/categories";
import { dateToMjd, objectId } from "@/lib/solar/orbits";

function useExplorerState(
  initial: OrbitRecord[],
  entries: SolarEntry[],
  categoryEntries: Category[],
  landing: boolean,
) {
  const categoryPalette = useMemo(
    () =>
      Object.fromEntries(
        categoryEntries.map((entry) => [
          Number(entry.objectTypeCode),
          entry.mainColor,
        ]),
      ),
    [categoryEntries],
  );
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
  const [distanceRange, setDistanceRange] = useState<[number, number]>([
    -Infinity,
    Infinity,
  ]);
  const [classificationRanges, setClassificationRanges] = useState<
    {
      object_type: number[];
      observed_property: string;
      observed_range_type: string;
      observed_value: number;
    }[]
  >([]);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/classification-ranges", { signal: controller.signal })
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.classification_ranges))
            setClassificationRanges(data.classification_ranges);
        }
      })
      .catch(() => {
        /* Fall back to the loaded catalog, like the legacy viewer. */
      });
    return () => controller.abort();
  }, []);
  const distanceBounds = useMemo<[number, number]>(() => {
    const ranges = new Map<number, [number, number]>();
    for (const record of records) {
      const code = categoryCode(record.object_type);
      if (code === undefined || !Number.isFinite(record.a)) continue;
      const range = ranges.get(code) ?? [Infinity, -Infinity];
      ranges.set(code, [
        Math.min(range[0], record.a),
        Math.max(range[1], record.a),
      ]);
    }
    for (const row of classificationRanges) {
      const code = row.object_type?.[0];
      if (
        row.observed_property !== "a" ||
        code === 7 ||
        !ranges.has(code) ||
        !Number.isFinite(row.observed_value)
      )
        continue;
      const range = ranges.get(code)!;
      if (row.observed_range_type === "min") range[0] = row.observed_value;
      if (row.observed_range_type === "max") range[1] = row.observed_value;
    }
    let min = Infinity;
    let max = -Infinity;
    for (const [code, range] of ranges) {
      if (!enabled.includes(code)) continue;
      min = Math.min(min, range[0]);
      max = Math.max(max, code === 7 ? range[1] : Math.min(range[1], 500));
    }
    return Number.isFinite(min) && max > min ? [min, max] : [0, 100];
  }, [records, enabled, classificationRanges]);
  const [mjd, updateMjd] = useState(() => {
    const shared = Number(params.get("mjd"));
    return Number.isFinite(shared) && shared >= 15020 && shared <= 88069
      ? shared
      : dateToMjd(new Date());
  });
  const [spinDate, setSpinDate] = useState(mjd);
  const setMjd = (value: number) => {
    setSpinDate((current) => current + value - mjd);
    updateMjd(value);
  };
  // Homepage orbits move visibly, while Explorer starts in real time (0 hr/s).
  const [speed, setSpeed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [showOrbits, setShowOrbits] = useState(true);
  const [quality, setQuality] = useState("low");
  useEffect(() => {
    const saved = localStorage.getItem("rubin-data-profile");
    if (saved && ["low", "medium", "high", "ultra"].includes(saved)) {
      // Hydrate the exploration preference shared with the tour gallery menu.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuality(saved);
    }
  }, []);
  const [cameraAction, setCameraAction] = useState({
    action: "reset",
    revision: 0,
  });
  const selectedId = params.get("target");
  const selected = records.find(
    (record) =>
      objectId(record) === selectedId || record.fulldesignation === selectedId,
  );
  const [selectionMode, setSelectionMode] = useState<"object" | "orbit">(
    "object",
  );
  const select = useCallback(
    (id?: string, mode: "object" | "orbit" = "object") => {
      setSelectionMode(mode);
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
    },
    [],
  );
  useEffect(() => {
    if (!playing) return;
    const started = performance.now();
    let last = started;
    let frame = 0;
    const tick = () => {
      const now = performance.now();
      const elapsed = Math.min((now - last) / 1000, 0.25);
      last = now;
      const orbitSpeed = landing ? 100 : speed;
      setSpinDate(
        (value) => value + ((landing ? 1 : speed) / 24 + 1 / 86400) * elapsed,
      );
      // Legacy SolarClock adds real elapsed time plus hours-per-second acceleration.
      updateMjd((value) =>
        Math.min(
          88069,
          Math.max(15020, value + (orbitSpeed / 24 + 1 / 86400) * elapsed),
        ),
      );
      frame = requestAnimationFrame(tick);
    };
    // Legacy updates SolarClock on each rendered frame, including axial spin.
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [speed, playing, landing]);
  const visible = useMemo(
    () =>
      records.filter(
        (record) =>
          enabled.includes(categoryCode(record.object_type) ?? 0) &&
          // Keep the planetary reference scene (bodies, labels and orbit paths)
          // available while filtering the survey catalog by discoverer.
          (record.object_type?.includes(7) ||
            discoverer === "all" ||
            Boolean(record.rubin_discovery) === (discoverer === "rubin")) &&
          record.a >= distanceRange[0] &&
          record.a <= distanceRange[1],
      ),
    [records, enabled, discoverer, distanceRange],
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
  const camera = useCallback(
    (action: string) =>
      setCameraAction((value) => ({ action, revision: value.revision + 1 })),
    [],
  );
  return {
    records,
    entries,
    categoryPalette,
    classificationRanges,
    addRecords,
    setCatalog,
    visible,
    enabled,
    setEnabled,
    discoverer,
    setDiscoverer,
    distanceRange,
    setDistanceRange,
    distanceBounds,
    mjd,
    rotationMjd: spinDate,
    setMjd,
    speed,
    setSpeed,
    playing,
    setPlaying,
    selectedId,
    selectionMode,
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
  categoryEntries,
  children,
  landing = false,
}: {
  initial: OrbitRecord[];
  entries: SolarEntry[];
  categoryEntries: Category[];
  children: ReactNode;
  landing?: boolean;
}) {
  const state = useExplorerState(initial, entries, categoryEntries, landing);
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
  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return records.filter((item) =>
        entries.some(
          (entry) =>
            entry.elementID === objectId(item) ||
            entry.elementID === item.fulldesignation,
        ),
      );
    }
    return records
      .filter((item) =>
        `${item.fulldesignation} ${item.id ?? ""} ${item.mpcdesignation ?? ""} ${entries.find((entry) => entry.elementID === objectId(item))?.title ?? ""}`
          .toLowerCase()
          .includes(trimmed),
      )
      .slice(0, 100);
  }, [records, entries, query]);
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
