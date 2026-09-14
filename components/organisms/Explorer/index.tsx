"use client";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/atoms/Icon";
import { Button } from "@/components/atoms/Button";
import { FiltersOverlay } from "@/components/organisms/FiltersOverlay";
import { ObjectsOverlay } from "@/components/organisms/ObjectsOverlay";
import { ShareOverlay } from "@/components/organisms/ShareOverlay";
import { TimeControls } from "@/components/molecules/TimeControls";
import {
  ExplorerProvider,
  useExplorer,
  useOrbitSearch,
} from "@/contexts/ExplorerProvider";
import type { OrbitRecord } from "@/lib/api/hasura";
import type { SolarEntry, Category } from "@/lib/api/craft";
import { objectId, orbitPosition } from "@/lib/solar/orbits";
import { Link } from "@/lib/i18n/navigation";
import { CmsImage } from "@/components/atoms/CmsImage";
import { LoadingScreen } from "@/components/organisms/LoadingScreen";
import styles from "./styles.module.css";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

function ZoomButton({
  direction,
  label,
}: {
  direction: "in" | "out";
  label: string;
}) {
  const { camera } = useExplorer();
  const held = useRef(false);
  const stop = () => {
    if (!held.current) return;
    held.current = false;
    camera("stop");
  };
  useEffect(() => {
    const release = () => {
      if (!held.current) return;
      held.current = false;
      camera("stop");
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
    };
  }, [camera]);
  return (
    <Button
      aria-label={label}
      style={{ touchAction: "none" }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        // Avoid a previous control's blur cancelling this new pointer gesture.
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        held.current = true;
        camera(`${direction}-hold`);
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onBlur={stop}
      onKeyDown={(event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        if (held.current) return;
        held.current = true;
        camera(`${direction}-hold`);
      }}
      onKeyUp={(event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          stop();
        }
      }}
      onClick={(event) => {
        if (event.detail === 0 && !held.current) camera(direction);
      }}
    >
      {direction === "in" ? "+" : "−"}
    </Button>
  );
}

function ExplorerSurface({
  children,
  contentError,
}: {
  children?: ReactNode;
  contentError?: boolean;
}) {
  const { t } = useTranslation();
  const explorer = useExplorer();
  const { selected, selectedId, entries, select, mjd } = explorer;
  const search = useOrbitSearch();
  const { quality, setQuality } = explorer;
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("orbitviewer-quality", { detail: quality }),
    );
  }, [quality]);
  useEffect(() => {
    const change = (event: Event) => {
      const value = (event as CustomEvent<string>).detail;
      if (["low", "medium", "high", "ultra"].includes(value)) setQuality(value);
    };
    window.addEventListener("orbitviewer-set-quality", change);
    return () => window.removeEventListener("orbitviewer-set-quality", change);
  }, [setQuality]);
  const [panel, setPanel] = useState<string | null>(null);
  useEffect(() => {
    const settings = () => setPanel("settings");
    const share = () =>
      setPanel((current) => (current === "share" ? null : "share"));
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    window.addEventListener("orbitviewer-settings", settings);
    window.addEventListener("orbitviewer-share", share);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("orbitviewer-settings", settings);
      window.removeEventListener("orbitviewer-share", share);
      window.removeEventListener("keydown", escape);
    };
  }, []);
  const [sceneReady, setSceneReady] = useState(false);
  const onSceneReady = useCallback(() => setSceneReady(true), []);
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
      {(!sceneReady || catalogLoading) && <LoadingScreen />}
      <div className={styles.canvas}>
        <Scene onReady={onSceneReady} ready={!catalogLoading && sceneReady} />
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
      {panel === "objects" && <ObjectsOverlay onClose={() => setPanel(null)} />}
      {panel === "filters" && <FiltersOverlay onClose={() => setPanel(null)} />}
      {panel === "share" && (
        <ShareOverlay
          onClose={() => setPanel(null)}
          getCanvas={() => surface.current?.querySelector("canvas")}
        />
      )}
      {panel &&
        panel !== "objects" &&
        panel !== "filters" &&
        panel !== "share" && (
          <aside
            className={styles.panel}
            aria-label={t(
              panel === "settings" ? "ui.displaySettings" : `toolbar.${panel}`,
            )}
          >
            <div className={styles.panelHead}>
              <h2>
                {t(
                  panel === "settings"
                    ? "ui.displaySettings"
                    : `toolbar.${panel}`,
                )}
              </h2>
              <Button onClick={() => setPanel(null)} aria-label={t("ui.close")}>
                ×
              </Button>
            </div>
            {panel === "settings" && (
              <>
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
                    onChange={(event) =>
                      explorer.setQuality(event.target.value)
                    }
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
        <ZoomButton direction="in" label={t("ui.zoomIn")} />
        <ZoomButton direction="out" label={t("ui.zoomOut")} />
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
  categoryEntries,
  children,
  contentError,
}: {
  initial: OrbitRecord[];
  entries: SolarEntry[];
  categoryEntries: Category[];
  children?: ReactNode;
  contentError?: boolean;
}) {
  return (
    <ExplorerProvider
      initial={initial}
      entries={entries}
      categoryEntries={categoryEntries}
    >
      <ExplorerSurface contentError={contentError}>{children}</ExplorerSurface>
    </ExplorerProvider>
  );
}
