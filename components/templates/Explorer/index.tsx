"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type FunctionComponent,
} from "react";
import { Canvas } from "@react-three/fiber";
import { useExplorer } from "@/contexts/Explorer";
import SolarClockProvider, { useSolarClock } from "@/contexts/SolarClock";
import SolarDataProvider, { useSolarData } from "@/contexts/SolarData";
import useClientTranslation from "@/lib/i18n/client";
import { CAMERA_CLIP } from "@/components/celestial-bodies/camera";
import Toolbar from "@/components/molecules/Toolbar";
import Layer from "@/components/atoms/Layer";
import Filters from "@/components/molecules/Filters";
import SearchPanel from "@/components/molecules/Search";
import SearchProvider from "@/contexts/Search";
import Loader from "@/components/atoms/Loader";
import Scene from "./Scene";
import styles from "./styles.module.css";

interface ExplorerProps {
  locale: string;
}

/**
 * Simulation date readout. Reads the throttled mirror, not the per-frame ref.
 *
 * Renders nothing until mounted. The clock seeds itself from `new Date()`, so
 * the server and client necessarily disagree about the current instant and
 * React reports a hydration mismatch on the <time> element. Deferring to after
 * hydration is correct rather than cosmetic: there is no "right" server value
 * for a live clock.
 */
const ClockReadout: FunctionComponent<{ locale: string }> = ({ locale }) => {
  const { displayDate, isLive } = useSolarClock();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <p className={styles.readout} />;

  return (
    <p className={styles.readout}>
      <time dateTime={displayDate.toISOString()}>
        {displayDate.toLocaleString(locale, {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "UTC",
        })}
      </time>
      {isLive && <span className={styles.live}> UTC · live</span>}
    </p>
  );
};

/**
 * The explorer's side panels.
 *
 * Which one is open lives in the `panel` search param, so the state survives
 * a reload and is shareable -- the same contract the object detail uses. The
 * bodies are placeholders; filters, search and the objects list are the next
 * phases.
 */
const ExplorerPanels: FunctionComponent<{ locale: string }> = ({ locale }) => {
  const { t } = useClientTranslation(locale);
  const { params, closePanel } = useExplorer();

  /**
   * The same filters the scene applies, so search cannot surface an object
   * that is hidden in the view.
   */
  const filters = useMemo(
    () => ({
      distance: params.distance
        ? { min: params.distance[0], max: params.distance[1] }
        : undefined,
      rubinOnly:
        params.discovery === "rubin"
          ? true
          : params.discovery === "other"
            ? false
            : undefined,
    }),
    [params.distance, params.discovery]
  );

  const panels = [
    { id: "objects" as const, labelKey: "toolbar.objects" },
    { id: "filters" as const, labelKey: "toolbar.filters" },
    { id: "search" as const, labelKey: "toolbar.search" },
  ];

  return (
    <SearchProvider filters={filters}>
      {panels.map(({ id, labelKey }) => (
        <div key={id} id={`explorer-panel-${id}`}>
          <Layer
            open={params.panel === id}
            onClose={closePanel}
            label={t(labelKey)}
          >
            {id === "filters" && <Filters locale={locale} />}
            {id === "search" && <SearchPanel locale={locale} />}
            {id === "objects" && <h2>{t(labelKey)}</h2>}
          </Layer>
        </div>
      ))}
    </SearchProvider>
  );
};

/** Dataset download state and object count. */
const DatasetStatus: FunctionComponent<{
  locale: string;
  selected?: string;
}> = ({ locale, selected }) => {
  const { t } = useClientTranslation(locale);
  const { elements, loading, progress, error } = useSolarData();

  if (error) {
    return <p className={styles.meta}>{t("core.loading")}</p>;
  }

  if (loading) {
    return (
      <p className={styles.meta}>
        {t("core.loading")}
        {progress > 0 ? ` ${Math.round(progress * 100)}%` : ""}
      </p>
    );
  }

  return (
    <p className={styles.meta}>
      {elements.length.toLocaleString(locale)} {t("core.objects")}
      {selected ? ` · ${selected}` : ""}
    </p>
  );
};

/** Covers the scene until the dataset has downloaded. */
const DatasetLoader: FunctionComponent<{ locale: string }> = ({ locale }) => {
  const { loading, progress } = useSolarData();

  if (!loading) return null;

  return <Loader locale={locale} progress={progress} />;
};

/**
 * Explorer shell: the WebGL canvas plus the UI layers drawn over it.
 *
 * The panels (object list, object detail, filters, search, time machine) are
 * still to come; they mount alongside the canvas rather than inside it.
 */
const Explorer: FunctionComponent<ExplorerProps> = ({ locale }) => {
  const { params, dataFileUrls } = useExplorer();

  return (
    <main className={styles.explorer}>
      <SolarDataProvider dataFileUrls={dataFileUrls}>
        <SolarClockProvider
          initialDate={params.date ? new Date(params.date) : undefined}
          initialHoursPerSecond={params.timeScale ?? 0}
        >
          <Canvas
            className={styles.canvas}
            camera={{ fov: 35, near: CAMERA_CLIP.near, far: CAMERA_CLIP.far }}
            gl={{
              // The scene spans six orders of magnitude, from a 24-unit
              // near limit to 3,000,000 units. A linear depth buffer
              // z-fights badly across that range.
              logarithmicDepthBuffer: true,
              antialias: true,
              powerPreference: "high-performance",
            }}
            // Rendering is on-demand elsewhere, but the clock advances every
            // frame, so the loop always runs.
            frameloop="always"
          >
            <color attach="background" args={["#000000"]} />
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </Canvas>

          <Toolbar locale={locale} />
          <ExplorerPanels locale={locale} />
          <DatasetLoader locale={locale} />

          <div className={styles.hud}>
            <ClockReadout locale={locale} />
            <DatasetStatus locale={locale} selected={params.object} />
          </div>
        </SolarClockProvider>
      </SolarDataProvider>
    </main>
  );
};

export default Explorer;
