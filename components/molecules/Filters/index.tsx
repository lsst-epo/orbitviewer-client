"use client";

import { useMemo, type FunctionComponent } from "react";
import Button from "@rubin-epo/epo-react-lib/Button";
import useClientTranslation from "@/lib/i18n/client";
import { calculateDistanceRanges } from "@/lib/solar/categories";
import { fromPlanetElements } from "@/lib/solar/elements";
import RangeSlider from "@/components/atoms/RangeSlider";
import ToggleGroup from "@/components/atoms/ToggleGroup";
import { useExplorer } from "@/contexts/Explorer";
import type { ExplorerParams } from "@/lib/explorer/searchParams";
import styles from "./styles.module.css";

/**
 * Filters panel.
 *
 * Ported from `layers/Filters.ts` and `partials/filters.njk`. Two controls,
 * matching the legacy: discovery source, and a distance range in AU. The
 * legacy also had a date-range slider, but it was commented out there and is
 * not carried over.
 *
 * Category toggles are deliberately absent -- in the legacy those lived in
 * the objects panel (`ObjectsFiltersPage`), not here.
 *
 * Both values live in the URL, so a filtered view is shareable and survives
 * a reload. There is no Apply step: the legacy's Apply button only closed the
 * panel, since changes already applied live as the controls moved.
 */

type Discovery = NonNullable<ExplorerParams["discovery"]>;

const Filters: FunctionComponent<{ locale: string }> = ({ locale }) => {
  const { t } = useClientTranslation(locale);
  const { params, setParams, classificationRanges, planets } = useExplorer();

  // Bounds come from Hasura's observed ranges, so the slider spans what the
  // catalogue actually contains rather than an arbitrary constant.
  const bounds = useMemo(() => {
    const elements = planets.map((planet) => fromPlanetElements(planet));
    return calculateDistanceRanges(classificationRanges, elements).totals;
  }, [classificationRanges, planets]);

  const distance = params.distance ?? [bounds.min, bounds.max];

  const discoveryOptions: Array<{ value: Discovery; label: string }> = [
    { value: "all", label: t("filters.toggle.all") },
    { value: "rubin", label: t("filters.toggle.rubin") },
    { value: "other", label: t("filters.toggle.other") },
  ];

  const reset = () => setParams({ discovery: "all", distance: undefined });

  const isDefault =
    (params.discovery ?? "all") === "all" && params.distance === undefined;

  return (
    <div className={styles.filters}>
      <div className={styles.head}>
        <h2 className={styles.title}>{t("filters.title")}</h2>
        <Button
          styleAs="secondary"
          onClick={reset}
          isInactive={isDefault}
          type="button"
        >
          {t("filters.reset")}
        </Button>
      </div>

      <div className={styles.body}>
        <ToggleGroup<Discovery>
          label={t("filters.discoveries")}
          options={discoveryOptions}
          value={params.discovery ?? "all"}
          onChange={(discovery) => setParams({ discovery })}
        />

        <RangeSlider
          label={t("filters.distance")}
          helper={t("filters.au")}
          value={[distance[0], distance[1]]}
          min={Math.floor(bounds.min)}
          max={Math.ceil(bounds.max)}
          onChange={(next) => setParams({ distance: next })}
          format={(n) => n.toFixed(1)}
        />
      </div>
    </div>
  );
};

export default Filters;
