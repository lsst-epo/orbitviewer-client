"use client";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type CSSProperties,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/atoms/Icon";
import { FiltersOverlay } from "@/components/organisms/FiltersOverlay";
import { ObjectsOverlay } from "@/components/organisms/ObjectsOverlay";
import { ShareOverlay } from "@/components/organisms/ShareOverlay";
import { TimeControls } from "@/components/molecules/TimeControls";
import { useExplorer, useOrbitSearch } from "@/contexts/ExplorerProvider";
import type { OrbitRecord } from "@/lib/api/hasura";
import {
  categories,
  categoryCode,
  categoryColor,
} from "@/lib/solar/categories";
import { objectId } from "@/lib/solar/orbits";
import { Link } from "@/lib/i18n/navigation";
import { LoadingScreen } from "@/components/organisms/LoadingScreen";
import { ObjectDetailCard } from "./ObjectDetailCard";
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
    <button
      type="button"
      aria-label={label}
      style={{ touchAction: "none" }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
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
      <Icon name={direction === "in" ? "add" : "substract"} />
    </button>
  );
}

export function ExplorerSurface({
  children,
  contentError,
  landing = false,
  departing = false,
  onDepartureComplete,
  onDiscoveryCount,
  tour = false,
  tourGallery = false,
}: {
  children?: ReactNode;
  contentError?: boolean;
  tour?: boolean;
  tourGallery?: boolean;
  landing?: boolean;
  departing?: boolean;
  onDepartureComplete?: () => void;
  onDiscoveryCount?: (count: number | null) => void;
}) {
  const { t } = useTranslation();
  const explorer = useExplorer();
  const {
    selected,
    selectedId,
    selectionMode,
    entries,
    categoryPalette,
    select,
    quality,
    setQuality,
  } = explorer;
  const search = useOrbitSearch();
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
    // Close open tool panels when switching into landing or gallery overlays.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (landing || tourGallery) setPanel(null);
  }, [landing, tourGallery]);
  useEffect(() => {
    const share = () =>
      !landing &&
      !tourGallery &&
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
  }, [landing, tourGallery]);
  const [sceneReady, setSceneReady] = useState(false);
  const onSceneReady = useCallback(() => setSceneReady(true), []);
  const [catalogError, setCatalogError] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const surface = useRef<HTMLDivElement>(null);
  const add = useRef(explorer.setCatalog);
  useEffect(() => {
    add.current = explorer.setCatalog;
  }, [explorer.setCatalog]);
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
        const data = (await response.json()) as {
          mpc_orbits?: OrbitRecord[];
          rubin_discoveries_count?: unknown;
        };
        if (!Array.isArray(data.mpc_orbits)) throw new Error("Invalid catalog");
        add.current(data.mpc_orbits);
        const count = data.rubin_discoveries_count;
        onDiscoveryCount?.(
          typeof count === "number" && Number.isSafeInteger(count) && count >= 0
            ? count
            : null,
        );
        window.dispatchEvent(new Event("orbitviewer-catalog-loaded"));
      })
      .catch(() => {
        if (!controller.signal.aborted) setCatalogError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });
    return () => controller.abort();
  }, [explorer.quality, onDiscoveryCount]);

  const backgroundOnly = landing || tourGallery;
  const hasLeftCard = Boolean((selectedId && !panel) || tour);
  const isPlanetSelected = Boolean(
    selectedId && selected?.object_type?.includes(7) && !tour,
  );

  return (
    <div
      ref={surface}
      className={styles.explorer}
      data-landing={landing}
      data-gallery={tourGallery}
    >
      {(!sceneReady || catalogLoading) && <LoadingScreen />}
      <div
        className={styles.canvas}
        aria-hidden={backgroundOnly || undefined}
        inert={backgroundOnly}
      >
        <Scene
          landing={landing}
          departing={departing}
          onDepartureComplete={onDepartureComplete}
          sceneReady={sceneReady}
          onReady={onSceneReady}
          ready={!catalogLoading && sceneReady}
        />
      </div>
      <main hidden={backgroundOnly}>
        <div
          className={styles.toolbar}
          data-hidden={Boolean((selectedId && !panel) || tour)}
        >
          <div className={styles.toolbarHead} />
          <div className={styles.toolbarBody}>
            {(["objects", "filters", "search"] as const).map((name) => (
              <div key={name} className={styles.toolbarItem}>
                <button
                  type="button"
                  aria-pressed={panel === name}
                  onClick={() => setPanel(panel === name ? null : name)}
                >
                  <span className={styles.iconWrap}>
                    <Icon name={name === "objects" ? "orbit" : name} />
                  </span>
                  <span>{t(`toolbar.${name}`)}</span>
                </button>
              </div>
            ))}
            <div className={styles.toolbarItem}>
              <Link href="/guided-experiences">
                <span className={styles.iconWrap}>
                  <Icon name="guides" />
                  <span className={styles.badge} />
                </span>
                <span>{t("toolbar.guides")}</span>
              </Link>
            </div>
          </div>
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
        {panel === "objects" && (
          <ObjectsOverlay onClose={() => setPanel(null)} />
        )}
        {panel === "filters" && (
          <FiltersOverlay onClose={() => setPanel(null)} />
        )}
        {panel === "share" && (
          <ShareOverlay
            onClose={() => setPanel(null)}
            getCanvas={() => surface.current?.querySelector("canvas")}
          />
        )}
        {panel === "search" && (
          <aside className={styles.searchPanel} aria-label={t("search.title")}>
            <div className={styles.searchHead}>
              <h2>{t("search.title")}</h2>
              <button
                type="button"
                className={styles.searchClose}
                onClick={() => setPanel(null)}
                aria-label={t("ui.close")}
              >
                <Icon name="close" />
              </button>
            </div>
            <div className={styles.searchBody}>
              <form
                className={styles.searchForm}
                onSubmit={(event) => {
                  event.preventDefault();
                  void search.searchCloud();
                }}
              >
                <input
                  type="search"
                  placeholder={t("search.placeholder")}
                  aria-label={t("search.title")}
                  value={search.query}
                  onChange={(event) => search.setQuery(event.target.value)}
                  maxLength={100}
                  autoFocus
                />
                {search.query.trim().length >= 2 && !search.results.length ? (
                  <button
                    type="submit"
                    className={styles.searchCloudBtn}
                    disabled={search.busy}
                  >
                    {search.busy ? t("ui.loading") : t("search.search_cloud")}
                  </button>
                ) : (
                  <span className={styles.searchIcon} aria-hidden="true">
                    <Icon name="search" />
                  </span>
                )}
              </form>
              <div className={styles.searchResults}>
                {!search.query.trim() && (
                  <h3 className={styles.searchSubhead}>
                    {t("search.recommended")}
                  </h3>
                )}
                {search.error && (
                  <p className={styles.searchEmpty} role="alert">
                    {t("ui.searchError")}
                  </p>
                )}
                {!search.error && !search.results.length && (
                  <p className={styles.searchEmpty}>{t("search.no_results")}</p>
                )}
                <ul className={styles.results}>
                  {search.results.map((record) => {
                    const id = objectId(record);
                    const cat = categories.find(
                      ({ code }) => code === categoryCode(record.object_type),
                    );
                    const color = categoryColor(
                      record.object_type,
                      categoryPalette,
                    );
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => {
                            select(id);
                            setPanel(null);
                          }}
                        >
                          <span>
                            {entries.find(
                              (entry) =>
                                entry.elementID === id ||
                                entry.elementID === record.fulldesignation,
                            )?.title ?? record.fulldesignation}
                          </span>
                          {cat && (
                            <span
                              className={styles.typeChip}
                              style={
                                { "--object-color": color } as CSSProperties
                              }
                            >
                              {t(`categories.${cat.key}.singular`)}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </aside>
        )}
        {selectedId && !tour && !panel && <ObjectDetailCard />}
        <div className={styles.mapControls}>
          <button
            type="button"
            onClick={() => {
              select();
              explorer.camera("reset");
            }}
            aria-label={t("ui.reset")}
          >
            <Icon name="center" />
          </button>
          <ZoomButton direction="in" label={t("ui.zoomIn")} />
          <ZoomButton direction="out" label={t("ui.zoomOut")} />
          <button
            type="button"
            className={styles.fullscreenBtn}
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              else void document.documentElement.requestFullscreen();
            }}
            aria-label={t("ui.fullscreen")}
          >
            <Icon name="fullscreen" />
          </button>
        </div>
        <div className={styles.time} data-shifted={hasLeftCard}>
          {isPlanetSelected && selectedId && (
            <div className={styles.viewToggle} role="group">
              {(["orbit", "object"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={selectionMode === mode}
                  onClick={() => select(selectedId, mode)}
                >
                  {t(`object.toggle.${mode}`)}
                </button>
              ))}
            </div>
          )}
          <TimeControls />
        </div>
      </main>
      {children}
    </div>
  );
}
