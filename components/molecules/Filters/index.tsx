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

type Discovery = NonNullable<ExplorerParams["discovery"]>;

const Filters: FunctionComponent<{ locale: string }> = ({ locale }) => {
  const { t } = useClientTranslation(locale);
  const { params, setParams, classificationRanges, planets } = useExplorer();

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
          className={styles.reset}
          styleAs="tertiary"
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
