"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FunctionComponent,
  type PropsWithChildren,
} from "react";
import { usePathname } from "@/lib/i18n/navigation";
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
import OrbitMark from "@/components/atoms/Loader/OrbitMark";
import ObjectDetail from "@/components/molecules/ObjectDetail";
import ObjectsPanel from "@/components/molecules/Objects";
import TimeMachine from "@/components/molecules/TimeMachine";
import MapControls from "@/components/molecules/MapControls";
import Onboarding from "@/components/organisms/Onboarding";
import PerformanceModal from "@/components/organisms/PerformanceModal";
import Wizard, { wizardDismissed } from "@/components/organisms/Wizard";
import { FADE_IN_SECONDS } from "@/components/scene/effects/solar-particles";
import { hasStoredQuality } from "@/lib/solar/quality";
import type { TourSummary } from "@/lib/tours";
import { ALL_CATEGORIES } from "@/lib/solar/categoryLabels";
import Chrome from "@/components/organisms/Chrome";
import styles from "./styles.module.css";

interface ExplorerProps {
  locale: string;
  /** Featured tours for onboarding's second step. */
  featuredTours?: Array<TourSummary>;
}

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
      showClose={false}
    >
      <ObjectDetail locale={locale} />
    </Layer>
  );
};

const ExplorerPanels: FunctionComponent<{ locale: string }> = ({ locale }) => {
  const { t } = useClientTranslation(locale);
  const { params, closePanel, visibleCategories } = useExplorer();

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
            size={id === "objects" ? "full" : "default"}
            side={id === "filters" ? "card" : "left"}
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

/**
 * True while the dataset downloads and for the particles' arrival fade after
 * it, when the field is still filling in. See solar-particles' README.
 */
const useFieldFilling = (loading: boolean): boolean => {
  const [filling, setFilling] = useState(loading);

  useEffect(() => {
    if (loading) {
      setFilling(true);
      return;
    }

    const timer = setTimeout(() => setFilling(false), FADE_IN_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [loading]);

  return loading || filling;
};

/** Dataset download state and object count. */
const DatasetStatus: FunctionComponent<{
  locale: string;
  selected?: string;
}> = ({ locale, selected }) => {
  const { t } = useClientTranslation(locale);
  const { elements, loading, error } = useSolarData();
  const filling = useFieldFilling(loading);

  if (error) {
    return <p className={styles.meta}>{t("core.loading")}</p>;
  }

  return (
    <>
      {filling && <OrbitMark compact />}
      {!loading && (
        <p className={styles.meta}>
          {elements.length.toLocaleString(locale)} {t("core.objects")}
          {selected ? ` · ${selected}` : ""}
        </p>
      )}
    </>
  );
};

/** Covers the scene until the dataset has downloaded. */
const DatasetLoader: FunctionComponent<{ locale: string }> = ({ locale }) => {
  const { loading, progress } = useSolarData();

  if (!loading) return null;

  return <Loader locale={locale} progress={progress} />;
};

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

const Explorer: FunctionComponent<PropsWithChildren<ExplorerProps>> = ({
  locale,
  featuredTours = [],
  children,
}) => {
  const { params } = useExplorer();
  // Read from the path, not from `children`: a layout always receives the
  // page element, so children is truthy on /explorer too. Same check Viewer
  // makes for the splash.
  const tour = usePathname().startsWith("/guided-experiences/");

  return (
    <>
      <Chrome locale={locale} tour={tour} />

      {!tour && (
        <>
          <FirstRun locale={locale} tours={featuredTours} />

          {params.panel !== "objects" && <Toolbar locale={locale} />}
          <ExplorerPanels locale={locale} />
          <ObjectLayer locale={locale} />

          <div className={styles.hud}>
            <DatasetStatus locale={locale} selected={params.object} />
          </div>

          <TimeMachine locale={locale} />
        </>
      )}

      {children}

      <MapControls locale={locale} />

      <DatasetLoader locale={locale} />
    </>
  );
};

export default Explorer;
