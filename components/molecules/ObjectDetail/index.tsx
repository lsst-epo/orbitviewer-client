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
import {
  resolveObject,
  resolveCraftElement,
} from "@/lib/explorer/resolveObject";
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

/**
 * Object detail.
 *
 * Ported from `pages/ObjectPage.ts` and `partials/object.njk`. The legacy had
 * this as two routes -- `/object/?id=` for catalogue objects and
 * `/solar-items/<slug>/` for the 45 Craft-authored ones -- both of which are
 * now this one panel, driven by the `object` search param.
 *
 * The two sources are complementary rather than exclusive: a Craft entry
 * supplies the copy (title, description, hero image, diameter) and the orbital
 * data supplies the figures. An object can have either or both.
 */

const AU = (value: number) => `${value.toFixed(2)}au`;

/** Craft returns `elementDiameter` as an untyped scalar. */
const diameterOf = (element: SolarElementEntry | undefined): number | null => {
  const raw = element?.elementDiameter;
  const value = typeof raw === "string" ? Number(raw) : raw;
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
};

/**
 * The object's own perihelion-to-aphelion span.
 *
 * The legacy drew "how far from the Sun today" against the semi-major axis
 * range for the whole category, which answers a different question -- it says
 * whether the object is near or far compared with its peers, not where it is
 * in its own orbit. Its companion bar, distance from Earth, was worse: the
 * range it scaled against (`DistanceFromEarth`) was only ever populated for
 * planets, so for any asteroid or comet it was drawn against
 * Infinity/-Infinity.
 *
 * Perihelion to aphelion is the range the figure actually moves through, so
 * the bar reads as progress around the orbit. Unbound orbits have no
 * aphelion, so they get the figure without a bar.
 */
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

  // The figures below are "as of the shown date", which the server cannot
  // know; see useMounted.
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
      resolveCraftElement(solarElementEntries(craftElements), params.object),
    [craftElements, params.object]
  );

  const earth = useMemo(
    () => bodies.find((body) => body.id === "earth"),
    [bodies]
  );

  const categoryColors = useMemo(
    () => categoryColorMap(categories),
    [categories]
  );

  // Bounds for the three comparison bars, for this object's category.
  const ranges = useMemo(() => {
    if (!object) return null;

    const forProperty = (property: string) =>
      calculateRanges(property, classificationRanges, bodies)[object.category];

    return { a: forProperty("a"), e: forProperty("e"), i: forProperty("i") };
  }, [object, classificationRanges, bodies]);

  if (!params.object) return null;

  // A shared link can name an object that is not in the loaded tier, or that
  // never existed. Saying so beats the legacy's silent redirect home.
  if (!object && !craft) {
    return (
      <div className={styles.detail}>
        <BackButton label={t("object.back")} onClick={closeObject} />
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

  /**
   * Days until perihelion, from the simulated date. The legacy measured this
   * from `new Date()` while showing a date computed from the simulated one, so
   * the two disagreed as soon as the time machine moved.
   */
  const daysToPerihelion = perihelion
    ? Math.floor(
        (perihelion.getTime() - displayDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <article className={styles.detail}>
      {/* The only way out of a selection besides Escape. The legacy card had
          the same control as its first element -- a link, since each object
          was its own page -- and the panel's own close button would sit
          underneath the navigation on this side. */}
      <BackButton label={t("object.back")} onClick={closeObject} />

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
                  // Craft is the source of truth; the token is the
                  // fallback so a category it has not coloured still reads.
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
            // Craft-authored rich text, from our own CMS.
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}
      </header>

      {/* The legacy showed this only for planets, but every selected body has
          an orbit worth seeing -- and without it the path is drawn off
          screen, since the camera frames the body itself. */}
      {object && (
        <ToggleGroup<"object" | "orbit">
          label={t("object.view.label")}
          options={[
            { value: "object", label: t("object.view.object") },
            { value: "orbit", label: t("object.view.orbit") },
          ]}
          // Falls back to whatever the scene will actually do, or the toggle
          // reads "Object" while the camera frames the orbit.
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
          {/* Semi-major axis is negative for an unbound orbit -- a = q/(1-e)
              flips sign past e = 1 -- so it is not a distance and cannot be
              compared against one. Those objects show perihelion instead,
              which is the distance that means something for them. */}
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
              // Propagated to the shown date. The legacy printed the epoch
              // value, which sat next to live distances and a live perihelion
              // date and disagreed with both -- Earth read 357.55 beside
              // "113 days" to a perihelion that 357.55 puts two days away.
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
              // No detail: the bubble on the track already reads the figure,
              // where the legacy's head slot repeated it.
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
