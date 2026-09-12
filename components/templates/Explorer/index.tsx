"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type FunctionComponent,
  type ReactNode,
} from "react";
import { Canvas } from "@react-three/fiber";
import { useExplorer } from "@/contexts/Explorer";
import SolarClockProvider from "@/contexts/SolarClock";
import SolarDataProvider, { useSolarData } from "@/contexts/SolarData";
import useClientTranslation from "@/lib/i18n/client";
import { CAMERA_CLIP } from "@/components/celestial-bodies/camera";
import Toolbar from "@/components/molecules/Toolbar";
import Layer from "@/components/atoms/Layer";
import Filters from "@/components/molecules/Filters";
import SearchPanel from "@/components/molecules/Search";
import SearchProvider from "@/contexts/Search";
import Loader from "@/components/atoms/Loader";
import ObjectDetail from "@/components/molecules/ObjectDetail";
import ObjectsPanel from "@/components/molecules/Objects";
import TimeMachine from "@/components/molecules/TimeMachine";
import MapControls from "@/components/molecules/MapControls";
import SceneControlsProvider from "@/contexts/SceneControls";
import Navigation from "@/components/organisms/Navigation";
import Share from "@/components/organisms/Share";
import CaptureProvider from "@/contexts/Capture";
import SceneCapture from "@/components/effects/capture";
import SceneBenchmark from "@/components/effects/benchmark";
import BenchmarkProvider, { useBenchmark } from "@/contexts/Benchmark";
import Onboarding from "@/components/organisms/Onboarding";
import PerformanceModal from "@/components/organisms/PerformanceModal";
import Wizard, { wizardDismissed } from "@/components/organisms/Wizard";
import { hasStoredQuality } from "@/lib/solar/quality";
import type { TourSummary } from "@/lib/tours";
import { ALL_CATEGORIES } from "@/lib/solar/categoryLabels";
import Scene from "./Scene";
import styles from "./styles.module.css";

interface ExplorerProps {
  locale: string;
  /** Featured tours for onboarding's second step. */
  featuredTours?: Array<TourSummary>;
  /**
   * Replaces the explorer's own chrome with the given overlay.
   *
   * A tour drives the scene itself -- which object is framed, where the clock
   * is -- so the toolbar, panels and time machine would be competing with it
   * for the same state. The legacy closed them all on entering guided mode
   * (`goToGuidedExperienceMode`); here they are simply not rendered.
   */
  overlay?: ReactNode;
}

/**
 * Object detail, docked opposite the toolbar panels.
 *
 * Driven by the `object` param rather than `panel`, so an object stays
 * selected -- and framed by the camera -- while the filters or search panel is
 * open over on the other side. Outside clicks do not dismiss it: a click in
 * the scene is how you pick a different object, and the legacy's global
 * document handler would have closed the card on the way.
 */
const ObjectLayer: FunctionComponent<{ locale: string }> = ({ locale }) => {
  const { t } = useClientTranslation(locale);
  const { params, closeObject } = useExplorer();

  return (
    <Layer
      open={Boolean(params.object)}
      onClose={closeObject}
      side="right"
      closeOnOutsideClick={false}
      label={params.object ?? t("toolbar.objects")}
      closeLabel={t("core.close")}
      // ObjectDetail carries its own labelled Back control. The header's
      // close button would sit directly underneath the navigation here, which
      // is where it has been hiding -- present, but covered and unclickable.
      showClose={false}
    >
      <ObjectDetail locale={locale} />
    </Layer>
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
  const { params, closePanel, visibleCategories } = useExplorer();

  /**
   * The same filters the scene applies, so search cannot surface an object
   * that is hidden in the view.
   */
  const filters = useMemo(
    () => ({
      categories:
        visibleCategories.size === ALL_CATEGORIES.length
          ? undefined
          : visibleCategories,
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
    [params.distance, params.discovery, visibleCategories]
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
            closeLabel={t("core.close")}
            // The objects rail is a row of cards; at the default width only
            // one is legible at a time.
            size={id === "objects" ? "wide" : "default"}
          >
            {id === "filters" && <Filters locale={locale} />}
            {id === "search" && <SearchPanel locale={locale} />}
            {id === "objects" && <ObjectsPanel locale={locale} />}
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
 * The navigation and the share dialog.
 *
 * Together because the menu owns the share trigger, and because both need the
 * data contexts -- quality from SolarData, params and clock for the link.
 *
 * Present during a tour as well: a reader still needs a way out and a
 * language switch. The exploration-mode item is not offered there, since
 * swapping datasets mid-tour would reload the scene under the slide.
 */
const ExplorerChrome: FunctionComponent<{
  locale: string;
  tour: boolean;
}> = ({ locale, tour }) => {
  const { quality, setQuality } = useSolarData();
  const [sharing, setSharing] = useState(false);

  return (
    <>
      <Navigation
        locale={locale}
        onShare={() => setSharing(true)}
        quality={tour ? undefined : quality}
        onQualityChange={tour ? undefined : setQuality}
      />
      <Share locale={locale} open={sharing} onClose={() => setSharing(false)} />
    </>
  );
};

/**
 * Onboarding on a first visit, and the performance nudge afterwards.
 *
 * The two are exclusive: someone still choosing a tier does not need to be
 * told the one they have not chosen yet is slow.
 */
const FirstRun: FunctionComponent<{
  locale: string;
  tours: Array<TourSummary>;
}> = ({ locale, tours }) => {
  const { quality, setQuality } = useSolarData();
  const { result } = useBenchmark();
  const [onboarding, setOnboarding] = useState(false);
  const [wizard, setWizard] = useState(false);
  const [nudged, setNudged] = useState(false);

  // Read after mount: localStorage during render would desync the markup.
  useEffect(() => {
    setOnboarding(!hasStoredQuality());
    setWizard(!wizardDismissed());
  }, []);

  const struggling =
    !onboarding &&
    !nudged &&
    quality !== "low" &&
    result !== null &&
    result.quality === "low";

  if (onboarding) {
    return (
      <Onboarding
        locale={locale}
        tours={tours}
        onDismiss={() => setOnboarding(false)}
      />
    );
  }

  // After onboarding, not alongside it: two overlays explaining the same
  // screen at once is one too many.
  if (wizard) {
    return <Wizard locale={locale} onDismiss={() => setWizard(false)} />;
  }

  if (!struggling) return null;

  return (
    <PerformanceModal
      locale={locale}
      onAccept={() => {
        setQuality("low");
        setNudged(true);
      }}
      onDismiss={() => setNudged(true)}
    />
  );
};

/**
 * Explorer shell: the WebGL canvas plus the UI layers drawn over it.
 *
 * The panels mount alongside the canvas rather than inside it. A tour swaps
 * the whole set for its own overlay -- see `overlay`.
 */
const Explorer: FunctionComponent<ExplorerProps> = ({
  locale,
  featuredTours = [],
  overlay,
}) => {
  const { params, dataFileUrls } = useExplorer();

  return (
    <main className={styles.explorer}>
      <SolarDataProvider dataFileUrls={dataFileUrls}>
        {/* Wraps the canvas and the dialog alike: the request is made in the
            DOM and fulfilled inside the render loop. */}
        <CaptureProvider>
          <BenchmarkProvider>
            <SceneControlsProvider>
              <SolarClockProvider
                initialDate={params.date ? new Date(params.date) : undefined}
                initialHoursPerSecond={params.timeScale ?? 0}
              >
                <Canvas
                  className={styles.canvas}
                  camera={{
                    fov: 35,
                    near: CAMERA_CLIP.near,
                    far: CAMERA_CLIP.far,
                  }}
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
                    <SceneCapture />
                    <SceneBenchmark />
                  </Suspense>
                </Canvas>

                <ExplorerChrome locale={locale} tour={Boolean(overlay)} />

                {/* First-run only, and never over a tour: arriving mid-tour is
              arriving with a purpose already chosen. */}
                {!overlay && <FirstRun locale={locale} tours={featuredTours} />}

                {overlay ?? (
                  <>
                    <Toolbar locale={locale} />
                    <ExplorerPanels locale={locale} />
                    <ObjectLayer locale={locale} />

                    <div className={styles.hud}>
                      <DatasetStatus locale={locale} selected={params.object} />
                    </div>

                    <TimeMachine locale={locale} />
                  </>
                )}

                {/* Outside the overlay switch: recentring and zooming are how
                    a reader looks around whatever a tour slide has framed,
                    so they belong in both modes. */}
                <MapControls locale={locale} />

                <DatasetLoader locale={locale} />
              </SolarClockProvider>
            </SceneControlsProvider>
          </BenchmarkProvider>
        </CaptureProvider>
      </SolarDataProvider>
    </main>
  );
};

export default Explorer;
