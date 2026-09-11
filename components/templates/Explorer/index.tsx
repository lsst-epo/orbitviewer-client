"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FunctionComponent,
  type ReactNode,
} from "react";
import { useExplorer } from "@/contexts/Explorer";
import { useSolarData } from "@/contexts/SolarData";
import { useBenchmark } from "@/contexts/Benchmark";
import useClientTranslation from "@/lib/i18n/client";
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
import Onboarding from "@/components/organisms/Onboarding";
import PerformanceModal from "@/components/organisms/PerformanceModal";
import Wizard, { wizardDismissed } from "@/components/organisms/Wizard";
import { hasStoredQuality } from "@/lib/solar/quality";
import type { TourSummary } from "@/lib/tours";
import { ALL_CATEGORIES } from "@/lib/solar/categoryLabels";
import Chrome from "./Chrome";
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
 * Object detail, the floating card on the left.
 *
 * Driven by the `object` param rather than `panel`, so an object stays
 * selected -- and framed by the camera -- while the filters or search panel is
 * open. Outside clicks do not dismiss it: a click in
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
      side="dock"
      closeOnOutsideClick={false}
      label={params.object ?? t("toolbar.objects")}
      closeLabel={t("core.close")}
      // ObjectDetail carries its own labelled Back control, and the card is
      // already inset clear of the navigation, so a second dismissal in the
      // header would be redundant clutter.
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
            // Objects is a full-viewport takeover, not a drawer: the scene
            // dims behind it and the cards run the width of the screen.
            size={id === "objects" ? "full" : "default"}
            // Filters is a small floating card near the top left, not a
            // full-height drawer -- see the Layer stylesheet.
            side={id === "filters" ? "card" : "left"}
            // Objects is a takeover in the legacy, with its own way out --
            // the back pill that stands in for the toolbar. Filters and
            // search sit beside the toolbar and keep the header's close.
            showClose={id !== "objects"}
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
  const { elements, loading, error } = useSolarData();

  if (error) {
    return <p className={styles.meta}>{t("core.loading")}</p>;
  }

  // Nothing while the dataset is still coming down: `DatasetLoader` is over
  // the whole scene saying exactly this, and the two lines were the same
  // sentence twice.
  if (loading) return null;

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
  const { params } = useExplorer();

  return (
    <>
      <Chrome locale={locale} tour={Boolean(overlay)} />

      {/* First-run only, and never over a tour: arriving mid-tour is
          arriving with a purpose already chosen. */}
      {!overlay && <FirstRun locale={locale} tours={featuredTours} />}

      {overlay ?? (
        <>
          {/* The objects panel is a takeover: the legacy stands the toolbar
              down rather than layering a close button over a rail the panel
              is already covering. The way back lives inside the panel, as it
              does there -- see `molecules/Objects`. */}
          {params.panel !== "objects" && <Toolbar locale={locale} />}
          <ExplorerPanels locale={locale} />
          <ObjectLayer locale={locale} />

          <div className={styles.hud}>
            <DatasetStatus locale={locale} selected={params.object} />
          </div>

          <TimeMachine locale={locale} />
        </>
      )}

      {/* Outside the overlay switch: recentring and zooming are how a reader
          looks around whatever a tour slide has framed, so they belong in
          both modes. */}
      <MapControls locale={locale} />

      <DatasetLoader locale={locale} />
    </>
  );
};

export default Explorer;
