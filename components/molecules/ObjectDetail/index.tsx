"use client";

import { useMemo, type CSSProperties, type FunctionComponent } from "react";
import Image from "next/image";
import useClientTranslation from "@/lib/i18n/client";
import useMounted from "@/lib/hooks/useMounted";
import {
  useExplorer,
  solarElementEntries,
  type SolarElementEntry,
} from "@/contexts/Explorer";
import { useSolarData } from "@/contexts/SolarData";
import { useSolarClock } from "@/contexts/SolarClock";
import { resolveObject, resolveCraftFor } from "@/lib/explorer/resolveObject";
import { defaultViewFor } from "@/lib/explorer/searchParams";
import { fromPlanetElements } from "@/lib/solar/elements";
import { calculateRanges, type Range } from "@/lib/solar/categories";
import { CATEGORY_LABELS } from "@/lib/solar/categoryLabels";
import { categoryColorMap } from "@/lib/solar/categoryColors";
import {
  distanceFromEarth,
  distanceFromSun,
  kmToMiles,
  meanAnomalyAt,
  nextPerihelion,
} from "@/lib/solar/stats";
import type { OrbitElements } from "@/lib/solar/types";
import Icon from "@/components/atoms/Icon";
import ToggleGroup from "@/components/atoms/ToggleGroup";
import Graph from "./Graph";
import OrbitalElement from "./OrbitalElement";
import styles from "./styles.module.css";

const AU = (value: number) => `${value.toFixed(2)}au`;

/** Craft returns `elementDiameter` as an untyped scalar. */
const diameterOf = (element: SolarElementEntry | undefined): number | null => {
  const raw = element?.elementDiameter;
  const value = typeof raw === "string" ? Number(raw) : raw;
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
};

/** The object's own perihelion-to-aphelion span; `null` if unbound. */
const orbitRange = (object: OrbitElements): Range | null => {
  if (object.e >= 1 || !Number.isFinite(object.a)) return null;

  const aphelion = object.a * (1 + object.e);
  if (!(aphelion > object.q)) return null;

  return { min: object.q, max: aphelion };
};

const BackButton: FunctionComponent<{
  label: string;
  onClick: () => void;
}> = ({ label, onClick }) => (
  <button type="button" className={styles.back} onClick={onClick}>
    <Icon name="chevronLeft" aria-hidden />
    <span>{label}</span>
  </button>
);

const ObjectDetail: FunctionComponent<{ locale: string }> = ({ locale }) => {
  const { t } = useClientTranslation(locale);
  const {
    params,
    setParams,
    closeObject,
    planets,
    dwarfPlanets,
    elements: craftElements,
    categories,
    classificationRanges,
  } = useExplorer();
  const { elements: mpcElements } = useSolarData();
  const { displayDate } = useSolarClock();

  const mounted = useMounted();

  const bodies = useMemo<Array<OrbitElements>>(
    () =>
      [...planets, ...dwarfPlanets].map((planet) => fromPlanetElements(planet)),
    [planets, dwarfPlanets]
  );

  const object = useMemo(
    () => resolveObject(params.object, [bodies, mpcElements]),
    [params.object, bodies, mpcElements]
  );

  const craft = useMemo(
    () =>
      resolveCraftFor(
        solarElementEntries(craftElements),
        object,
        params.object
      ),
    [craftElements, object, params.object]
  );

  const earth = useMemo(
    () => bodies.find((body) => body.id === "earth"),
    [bodies]
  );

  const categoryColors = useMemo(
    () => categoryColorMap(categories),
    [categories]
  );

  const ranges = useMemo(() => {
    if (!object) return null;

    const forProperty = (property: string) =>
      calculateRanges(property, classificationRanges, bodies)[object.category];

    return { a: forProperty("a"), e: forProperty("e"), i: forProperty("i") };
  }, [object, classificationRanges, bodies]);

  if (!params.object) return null;

  if (!object && !craft) {
    return (
      <div className={styles.detail}>
        <BackButton label={t("core.back")} onClick={closeObject} />
        <p className={styles.empty}>
          {t("search.not_found", { query: params.object })}
        </p>
      </div>
    );
  }

  const category = object?.category;
  const label = category ? CATEGORY_LABELS[category] : null;
  const diameter = diameterOf(craft);
  const description = craft?.textBody?.html;
  const hero = craft?.elementPreview?.[0]?.url;

  const live = mounted && object ? object : null;
  const sunDistance = live ? distanceFromSun(live, displayDate) : null;
  const earthDistance = live
    ? distanceFromEarth(live, earth, displayDate)
    : null;
  const perihelion = live ? nextPerihelion(live, displayDate) : null;
  const sunRange = live ? orbitRange(live) : null;

  const daysToPerihelion = perihelion
    ? Math.floor(
        (perihelion.getTime() - displayDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <article className={styles.detail}>
      <BackButton label={t("core.back")} onClick={closeObject} />

      <header className={styles.heading}>
        <h2 className={styles.title}>
          {craft?.title ?? object?.fulldesignation ?? params.object}
        </h2>

        {craft && object?.fulldesignation && (
          <dl className={styles.designation}>
            <dt className={styles.designationLabel}>
              {t("object.designation")}
            </dt>
            <dd className={styles.designationValue}>
              {object.fulldesignation}
            </dd>
          </dl>
        )}

        {hero && (
          <div className={styles.hero}>
            <Image
              src={hero}
              alt={`${t("object.hero.alt")} ${craft?.title ?? ""}`.trim()}
              width={800}
              height={800}
              sizes="(max-width: 48rem) 100vw, 24rem"
            />
          </div>
        )}

        {label && (
          <p className={styles.category}>
            <span
              className={styles.chip}
              style={
                {
                  "--chip-color":
                    categoryColors.get(label.icon) ??
                    `var(--color-${label.icon})`,
                } as CSSProperties
              }
            >
              <Icon name={label.icon} className={styles.chipIcon} aria-hidden />
              <span>{t(label.nameKey)}</span>
            </span>
          </p>
        )}

        {description && (
          <div
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}
      </header>

      {object && (
        <ToggleGroup<"object" | "orbit">
          label={t("object.view.label")}
          options={[
            { value: "object", label: t("object.view.object") },
            { value: "orbit", label: t("object.view.orbit") },
          ]}
          value={params.view ?? defaultViewFor(object.id)}
          onChange={(view) => setParams({ view })}
        />
      )}

      {diameter !== null && (
        <section className={styles.unit}>
          <h3 className={styles.unitTitle}>{t("object.diameter")}</h3>
          <p className={styles.value}>
            <span className={styles.primary}>{diameter.toFixed(2)}km</span>
            <span className={styles.secondary}>
              {kmToMiles(diameter).toFixed(2)}mi
            </span>
          </p>
        </section>
      )}

      {object && ranges && label && (
        <section className={styles.unit}>
          <h3 className={styles.unitTitle}>
            {t("object.comparison").replace("%category%", t(label.nameKey))}
          </h3>
          {/* Semi-major axis is negative for an unbound orbit, so it is not
              a distance and cannot be compared against one. */}
          {object.e < 1 ? (
            <Graph
              label={t("object.sun_graph.title")}
              detail={t("object.sun_graph.detail")}
              value={object.a}
              range={ranges.a}
              format={AU}
            />
          ) : (
            <p className={styles.value}>
              <span className={styles.primary}>
                {t("object.perihelion_distance")}
              </span>
              <span className={styles.secondary}>{AU(object.q)}</span>
            </p>
          )}
          <Graph
            label={t("object.deviation_graph.title")}
            detail={t("object.deviation_graph.detail")}
            value={object.e}
            range={ranges.e}
            format={(value) => value.toFixed(3)}
          />
          <Graph
            label={t("object.angle_graph.title")}
            detail={t("object.angle_graph.detail")}
            value={object.i}
            range={ranges.i}
            format={(value) => `${value.toFixed(1)}°`}
          />
        </section>
      )}

      {object && (
        <section className={styles.unit}>
          <h3 className={styles.unitTitle}>
            {t("object.orbital_elements.title")}
          </h3>
          <ul
            className={styles.elements}
            aria-label={t("object.orbital_elements.aria")}
          >
            <OrbitalElement
              symbol="ω"
              label={t("object.orbital_elements.periapsis.aria")}
              value={object.w.toFixed(2)}
              description={t("object.orbital_elements.periapsis.tooltip")}
              infoLabel={t("object.orbital_elements.info")}
            />
            <OrbitalElement
              symbol="Ω"
              label={t("object.orbital_elements.longitude.aria")}
              value={object.N.toFixed(2)}
              description={t("object.orbital_elements.longitude.tooltip")}
              infoLabel={t("object.orbital_elements.info")}
            />
            <OrbitalElement
              symbol="v"
              label={t("object.orbital_elements.anomaly.aria")}
              value={live ? meanAnomalyAt(live, displayDate).toFixed(2) : ""}
              description={t("object.orbital_elements.anomaly.tooltip")}
              infoLabel={t("object.orbital_elements.info")}
            />
          </ul>
        </section>
      )}

      {perihelion && (
        <section className={styles.unit}>
          <h3 className={styles.unitTitle}>{t("object.closest_sun.title")}</h3>
          <p className={styles.value}>
            <time
              className={styles.primary}
              dateTime={perihelion.toISOString().slice(0, 10)}
            >
              {perihelion.toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "2-digit",
              })}
            </time>
            {daysToPerihelion !== null && (
              <span className={styles.secondary}>
                {daysToPerihelion} {t("object.closest_sun.days_left")}
              </span>
            )}
          </p>
        </section>
      )}

      {sunDistance !== null && (
        <section className={styles.unit}>
          <h3 className={styles.unitTitle}>{t("object.how_far.title")}</h3>
          {sunRange ? (
            <Graph
              label={t("object.how_far.from_sun")}
              value={sunDistance}
              range={sunRange}
              format={AU}
            />
          ) : (
            <p className={styles.value}>
              <span className={styles.primary}>
                {t("object.how_far.from_sun")}
              </span>
              <span className={styles.secondary}>{AU(sunDistance)}</span>
            </p>
          )}

          {earthDistance !== null && (
            <p className={styles.value}>
              <span className={styles.primary}>
                {t("object.how_far.from_earth")}
              </span>
              <span className={styles.secondary}>{AU(earthDistance)}</span>
            </p>
          )}
        </section>
      )}
    </article>
  );
};

export default ObjectDetail;
