"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/atoms/Icon";
import { Button } from "@/components/atoms/Button";
import { ShareControls } from "@/components/molecules/ShareControls";
import { TimeControls } from "@/components/molecules/TimeControls";
import {
  ExplorerProvider,
  useExplorer,
  useOrbitSearch,
} from "@/contexts/ExplorerProvider";
import type { OrbitRecord } from "@/lib/api/hasura";
import type { SolarEntry } from "@/lib/api/craft";
import { categories } from "@/lib/solar/categories";
import { objectId, orbitPosition } from "@/lib/solar/orbits";
import { Link } from "@/lib/i18n/navigation";
import { CmsImage } from "@/components/atoms/CmsImage";
import styles from "./styles.module.css";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

function ExplorerSurface({
  children,
  contentError,
}: {
  children?: ReactNode;
  contentError?: boolean;
}) {
  const { t } = useTranslation();
  const explorer = useExplorer();
  const { enabled, setEnabled, selected, selectedId, entries, select, mjd } =
    explorer;
  const search = useOrbitSearch();
  const [panel, setPanel] = useState<string | null>(null);
  useEffect(() => {
    const share = () =>
      setPanel((current) => (current === "share" ? null : "share"));
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    window.addEventListener("orbitviewer-share", share);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("orbitviewer-share", share);
      window.removeEventListener("keydown", escape);
    };
  }, []);
  const [catalogError, setCatalogError] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [onboard, setOnboard] = useState(false);
  const surface = useRef<HTMLDivElement>(null);
  const add = useRef(explorer.setCatalog);
  useEffect(() => {
    add.current = explorer.setCatalog;
  }, [explorer.setCatalog]);
  useEffect(() => {
    // Hydrate the persisted onboarding preference after SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnboard(!localStorage.getItem("orbitviewer-onboarded"));
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    // A mode change starts a new external catalog request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCatalogLoading(true);
    setCatalogError(false);
    fetch(`/api/catalog?quality=${explorer.quality}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Catalog unavailable");
        const data = (await response.json()) as { mpc_orbits?: OrbitRecord[] };
        if (!Array.isArray(data.mpc_orbits)) throw new Error("Invalid catalog");
        add.current(data.mpc_orbits);
      })
      .catch(() => {
        if (!controller.signal.aborted) setCatalogError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });
    return () => controller.abort();
  }, [explorer.quality]);
  const info = entries.find(
    (entry) =>
      entry.elementID === selectedId ||
      entry.elementID === selected?.fulldesignation,
  );
  const closeOnboarding = () => {
    localStorage.setItem("orbitviewer-onboarded", "true");
    setOnboard(false);
  };
  return (
    <main ref={surface} className={styles.explorer}>
      <div className={styles.canvas}>
        <Scene />
      </div>
      <div className={styles.toolbar}>
        {(
          [
            ["objects", "Objects"],
            ["filters", "Filter"],
            ["search", "Search"],
          ] as const
        ).map(([name]) => (
          <Button
            key={name}
            aria-pressed={panel === name}
            onClick={() => setPanel(panel === name ? null : name)}
          >
            <Icon name={name === "objects" ? "orbit" : name} />
            {t(`toolbar.${name}`)}
          </Button>
        ))}
        <Link href="/guided-experiences">
          <Icon name="guides" />
          {t("toolbar.guides")}
        </Link>
      </div>
      {(catalogLoading || catalogError || contentError) && (
        <p className={styles.status} role="status">
          {catalogLoading
            ? t("ui.loading")
            : catalogError
              ? t("ui.catalogError")
              : t("ui.unavailable")}
        </p>
      )}
      {panel && (
        <aside
          className={styles.panel}
          aria-label={t(panel === "share" ? "ui.share" : `toolbar.${panel}`)}
        >
          <div className={styles.panelHead}>
            <h2>{t(panel === "share" ? "ui.share" : `toolbar.${panel}`)}</h2>
            <Button onClick={() => setPanel(null)} aria-label={t("ui.close")}>
              ×
            </Button>
          </div>
          {panel === "objects" && (
            <>
              <p>{t("objects.subtitle")}</p>
              <ul className={styles.results}>
                {entries.map((entry) => (
                  <li key={entry.elementID}>
                    <button
                      onClick={() => {
                        select(entry.elementID);
                        setPanel(null);
                      }}
                    >
                      {entry.title}
                    </button>
                  </li>
                ))}
              </ul>
              {categories.map(({ code, key, color }) => (
                <label className={styles.check} key={code}>
                  <input
                    type="checkbox"
                    checked={enabled.includes(code)}
                    onChange={(event) =>
                      setEnabled(
                        event.target.checked
                          ? [...enabled, code]
                          : enabled.filter((item) => item !== code),
                      )
                    }
                  />
                  <span style={{ color }}>
                    {t(`objects.types.${key}.name`)}
                  </span>
                </label>
              ))}
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={explorer.showOrbits}
                  onChange={(event) =>
                    explorer.setShowOrbits(event.target.checked)
                  }
                />
                {t("ui.orbits")}
              </label>
              <label className={styles.field}>
                {t("ui.quality")}
                <select
                  value={explorer.quality}
                  onChange={(event) => explorer.setQuality(event.target.value)}
                >
                  {["low", "medium", "high", "ultra"].map((quality) => (
                    <option key={quality} value={quality}>
                      {t(`ui.${quality}`)}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          {panel === "filters" && (
            <>
              <label className={styles.field}>
                {t("filters.discoveries")}
                <select
                  value={explorer.discoverer}
                  onChange={(event) =>
                    explorer.setDiscoverer(event.target.value)
                  }
                >
                  {["all", "rubin", "other"].map((value) => (
                    <option key={value} value={value}>
                      {t(`filters.toggle.${value}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                {t("ui.distance")}
                <input
                  type="range"
                  min="1"
                  max="500"
                  value={explorer.distance}
                  onChange={(event) =>
                    explorer.setDistance(Number(event.target.value))
                  }
                />
                <output>{explorer.distance}</output>
              </label>
              <Button
                onClick={() => {
                  explorer.setDistance(500);
                  explorer.setDiscoverer("all");
                  setEnabled(categories.map(({ code }) => code));
                }}
              >
                {t("filters.reset")}
              </Button>
            </>
          )}
          {panel === "search" && (
            <>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void search.searchCloud();
                }}
              >
                <input
                  aria-label={t("search.title")}
                  value={search.query}
                  onChange={(event) => search.setQuery(event.target.value)}
                  maxLength={100}
                />
                <Button
                  type="submit"
                  disabled={search.query.trim().length < 2 || search.busy}
                >
                  {search.busy ? t("ui.loading") : t("search.search_cloud")}
                </Button>
              </form>
              {search.error && <p role="alert">{t("ui.searchError")}</p>}
              {!search.results.length && <p>{t("ui.empty")}</p>}
              <ul className={styles.results}>
                {search.results.map((record) => (
                  <li key={objectId(record)}>
                    <button
                      onClick={() => {
                        select(objectId(record));
                        setPanel(null);
                      }}
                    >
                      {entries.find(
                        (entry) => entry.elementID === objectId(record),
                      )?.title ?? record.fulldesignation}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {panel === "share" && (
            <ShareControls
              getCanvas={() => surface.current?.querySelector("canvas")}
            />
          )}
        </aside>
      )}
      {selectedId && !children && !panel && (
        <aside className={`${styles.panel} ${styles.details}`}>
          <div className={styles.panelHead}>
            <h2>
              {info?.title ??
                (selectedId === "sun"
                  ? t("ui.sun")
                  : (selected?.fulldesignation ?? selectedId))}
            </h2>
            <Button onClick={() => select()} aria-label={t("ui.close")}>
              ×
            </Button>
          </div>
          {info?.elementPreview?.[0]?.url && (
            <CmsImage src={info.elementPreview[0].url} alt={info.title} />
          )}
          {info?.textBody?.plainText && <p>{info.textBody.plainText}</p>}
          {selected && (
            <dl>
              {[
                [
                  t("ui.distance"),
                  orbitPosition(selected, mjd).length().toFixed(3),
                ],
                [t("ui.semimajor"), selected.a.toFixed(3)],
                [t("ui.eccentricity"), selected.e.toFixed(4)],
                [t("ui.inclination"), `${selected.i.toFixed(2)}°`],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {info?.viewInSkyviewerLink && (
            <a href={info.viewInSkyviewerLink}>Skyviewer ↗</a>
          )}
        </aside>
      )}
      <div className={styles.mapControls}>
        <Button
          onClick={() => {
            select();
            explorer.camera("reset");
          }}
          aria-label={t("ui.reset")}
        >
          <Icon name="center" />
        </Button>
        <Button
          onClick={() => explorer.camera("in")}
          aria-label={t("ui.zoomIn")}
        >
          +
        </Button>
        <Button
          onClick={() => explorer.camera("out")}
          aria-label={t("ui.zoomOut")}
        >
          −
        </Button>
        <Button
          onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else void document.documentElement.requestFullscreen();
          }}
          aria-label={t("ui.fullscreen")}
        >
          ⛶
        </Button>
      </div>
      <div className={styles.time}>
        <TimeControls />
      </div>
      {children}
      {onboard && !children && (
        <div
          className={styles.onboarding}
          role="dialog"
          aria-modal="false"
          aria-labelledby="onboarding-title"
        >
          <h1 id="onboarding-title">{t("ui.onboarding")}</h1>
          <p>{t("ui.help")}</p>
          <Button onClick={closeOnboarding}>{t("ui.start")}</Button>{" "}
          <Link href="/guided-experiences">{t("toolbar.guides")}</Link>
        </div>
      )}
    </main>
  );
}
export function Explorer({
  initial,
  entries,
  children,
  contentError,
}: {
  initial: OrbitRecord[];
  entries: SolarEntry[];
  children?: ReactNode;
  contentError?: boolean;
}) {
  return (
    <ExplorerProvider initial={initial} entries={entries}>
      <ExplorerSurface contentError={contentError}>{children}</ExplorerSurface>
    </ExplorerProvider>
  );
}
