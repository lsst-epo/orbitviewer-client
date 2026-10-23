"use client";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/atoms/Icon";
import { CmsImage } from "@/components/atoms/CmsImage";
import { RichText } from "@/components/atoms/RichText";
import { useExplorer } from "@/contexts/ExplorerProvider";
import {
  categories,
  categoryCode,
  categoryColor,
} from "@/lib/solar/categories";
import { mjdToDate, objectId, orbitPosition } from "@/lib/solar/orbits";
import styles from "./styles.module.css";

const GRAPHS = [
  {
    key: "a",
    prop: "a" as const,
    unit: "au",
    icons: ["sun", "stars"] as const,
    fallback: [0, 50] as [number, number],
  },
  {
    key: "e",
    prop: "e" as const,
    unit: "",
    icons: ["eccentricity-low", "eccentricity-high"] as const,
    fallback: [0, 1] as [number, number],
  },
  {
    key: "i",
    prop: "i" as const,
    unit: "°",
    icons: ["inclination-low", "inclination-high"] as const,
    fallback: [0, 180] as [number, number],
  },
];

export function ObjectDetailCard() {
  const { t, i18n } = useTranslation();
  const {
    selected,
    selectedId,
    entries,
    records,
    categoryPalette,
    classificationRanges,
    select,
    mjd,
  } = useExplorer();

  if (!selectedId) return null;

  const info = entries.find(
    (entry) =>
      entry.elementID === selectedId ||
      entry.elementID === selected?.fulldesignation,
  );
  const isSun = selectedId === "sun";
  const title =
    info?.title ??
    (isSun ? t("ui.sun") : (selected?.fulldesignation ?? selectedId));
  const code = isSun ? 9 : categoryCode(selected?.object_type);
  const category = categories.find((item) => item.code === code);
  const catKey = category?.key ?? "planets";
  const catIcon = isSun
    ? "sun_star"
    : catKey === "trojans"
      ? "jupiter-trojans"
      : catKey.replaceAll("_", "-");
  const color = isSun
    ? "var(--color-sun)"
    : categoryColor(selected?.object_type, categoryPalette);
  const catSingular = isSun
    ? t("ui.sun")
    : t(`categories.${catKey}.singular`);
  const catPlural = t(`categories.${catKey}.plural`).toLowerCase();

  const rangeFor = (
    prop: "a" | "e" | "i",
    fallback: [number, number],
  ): [number, number] => {
    const rows = classificationRanges.filter(
      (row) =>
        row.object_type?.[0] === code && row.observed_property === prop,
    );
    const minRow = rows.find((row) => row.observed_range_type === "min");
    const maxRow = rows.find((row) => row.observed_range_type === "max");
    if (minRow && maxRow && maxRow.observed_value > minRow.observed_value) {
      return [minRow.observed_value, maxRow.observed_value];
    }
    const sameCat = records.filter(
      (rec) =>
        categoryCode(rec.object_type) === code && Number.isFinite(rec[prop]),
    );
    if (sameCat.length > 1) {
      const vals = sameCat.map((rec) => rec[prop]);
      return [Math.min(...vals), Math.max(...vals)];
    }
    return fallback;
  };

  const earth = records.find((rec) => objectId(rec) === "earth");
  const pos = selected ? orbitPosition(selected, mjd) : null;
  const fromSun = pos ? pos.length() : 0;
  const fromEarth =
    pos && earth ? pos.distanceTo(orbitPosition(earth, mjd)) : fromSun;

  const periodDays =
    selected && selected.a > 0 ? Math.pow(selected.a, 1.5) * 365.25 : 0;
  let nextPerihelionMjd = selected?.peri_time ?? mjd;
  if (periodDays > 0 && Number.isFinite(nextPerihelionMjd)) {
    while (nextPerihelionMjd < mjd) nextPerihelionMjd += periodDays;
    while (nextPerihelionMjd - periodDays > mjd)
      nextPerihelionMjd -= periodDays;
  }
  const daysLeft = Math.max(0, Math.round(nextPerihelionMjd - mjd));
  const perihelionDate = mjdToDate(nextPerihelionMjd).toLocaleDateString(
    i18n.language,
    { year: "numeric", month: "short", day: "numeric" },
  );

  return (
    <aside className={styles.objectCard} aria-label={title}>
      <div className={styles.objectHead}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => select()}
        >
          <Icon name="chevron-left" />
          <span>{t("object.close")}</span>
        </button>
      </div>
      <div className={styles.objectBody}>
        <div className={styles.objectHeading}>
          <div className={styles.objectTitleGroup}>
            <h1>{title}</h1>
            {selected?.fulldesignation && (
              <dl className={styles.designation}>
                <dt>{t("object.designation")}</dt>
                <dd>{selected.fulldesignation}</dd>
              </dl>
            )}
          </div>
          {info?.elementPreview?.[0]?.url && (
            <div className={styles.objectHero}>
              <CmsImage src={info.elementPreview[0].url} alt={title} />
            </div>
          )}
          <div>
            <span
              className={styles.typeChip}
              style={{ "--object-color": color } as CSSProperties}
            >
              <span className={styles.typeChipIcon}>
                <Icon name={catIcon} />
              </span>
              <span>{catSingular}</span>
            </span>
          </div>
          {info?.textBody?.html ? (
            <div className={styles.objectText}>
              <RichText html={info.textBody.html} />
            </div>
          ) : (
            info?.textBody?.plainText && (
              <div className={styles.objectText}>
                <p>{info.textBody.plainText}</p>
              </div>
            )
          )}
          {info?.viewInSkyviewerLink && (
            <p className={styles.skyviewerLink}>
              <a
                href={info.viewInSkyviewerLink}
                target="_blank"
                rel="noreferrer"
              >
                {t("object.skyviewer")} ↗
              </a>
            </p>
          )}
        </div>

        {info?.elementDiameter && (
          <div className={styles.unit}>
            <h2>{t("object.diameter")}</h2>
            <p className={styles.diameter}>
              <strong>
                {Number(info.elementDiameter).toLocaleString(i18n.language)} km
              </strong>
              <span>
                {Math.round(
                  Number(info.elementDiameter) * 0.621371,
                ).toLocaleString(i18n.language)}{" "}
                mi
              </span>
            </p>
          </div>
        )}

        {selected && (
          <>
            <div className={styles.unit}>
              <h2>
                {t("object.graphs.title", { category: catPlural }).replace(
                  "<category>",
                  catPlural,
                )}
              </h2>
              <div className={styles.graphs}>
                {GRAPHS.map(({ key, prop, unit, icons, fallback }) => {
                  const val = selected[prop];
                  const [min, max] = rangeFor(prop, fallback);
                  const pct = Math.min(
                    100,
                    Math.max(0, ((val - min) / (max - min || 1)) * 100),
                  );
                  return (
                    <div key={key} className={styles.graphItem}>
                      <div className={styles.graphHead}>
                        <span className={styles.graphTitle}>
                          {t(`object.graphs.items.${key}.title`)}
                        </span>
                        <span className={styles.graphValue}>
                          {val.toFixed(2)}
                          {unit ? ` ${unit}` : ""}
                        </span>
                      </div>
                      <div className={styles.graphBarRow}>
                        <Icon name={icons[0]} />
                        <div className={styles.progressBar}>
                          <span
                            className={styles.progressFill}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <Icon name={icons[1]} />
                      </div>
                      <div className={styles.graphExtremes}>
                        <span>
                          {min.toFixed(2)}
                          {unit ? ` ${unit}` : ""}
                        </span>
                        <span>
                          {max.toFixed(2)}
                          {unit ? ` ${unit}` : ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.unit}>
              <h2>{t("object.orbital_elements.title")}</h2>
              <ul className={styles.elementsList}>
                {[
                  { sym: "ω", key: "w", val: selected.argperi },
                  { sym: "Ω", key: "om", val: selected.node },
                  { sym: "v", key: "v", val: selected.mean_anomaly },
                ].map(({ sym, key, val }) => (
                  <li key={key} className={styles.elementItem}>
                    <span className={styles.elementSymbol}>{sym}</span>
                    <span className={styles.elementName}>
                      {t(`object.orbital_elements.items.${key}.title`)}
                    </span>
                    <strong className={styles.elementValue}>
                      {Number(val ?? 0).toFixed(2)}°
                    </strong>
                  </li>
                ))}
              </ul>
            </div>

            {Number.isFinite(selected.peri_time) && periodDays > 0 && (
              <div className={styles.unit}>
                <h2>{t("object.closest_sun.title")}</h2>
                <div className={styles.closestSun}>
                  <Icon name="sun" />
                  <strong>{perihelionDate}</strong>
                  <span>
                    {daysLeft.toLocaleString(i18n.language)}{" "}
                    {t("object.closest_sun.days_left")}
                  </span>
                </div>
              </div>
            )}

            <div className={styles.unit}>
              <h2>{t("object.distance.title")}</h2>
              <div className={styles.distances}>
                {[
                  {
                    icon: "sun",
                    label: t("object.distance.from_sun"),
                    val: fromSun,
                  },
                  {
                    icon: "earth",
                    label: t("object.distance.from_earth"),
                    val: fromEarth,
                  },
                ].map(({ icon, label, val }) => (
                  <div key={icon} className={styles.distanceItem}>
                    <div className={styles.graphHead}>
                      <span className={styles.graphTitle}>{label}</span>
                      <span className={styles.graphValue}>
                        {val.toFixed(2)} au
                      </span>
                    </div>
                    <div className={styles.graphBarRow}>
                      <Icon name={icon} />
                      <div className={styles.progressBar}>
                        <span
                          className={styles.progressFill}
                          style={{
                            width: `${Math.min(100, (val / 35) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
