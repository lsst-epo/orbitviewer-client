"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ExplorerProvider, useExplorer } from "@/contexts/ExplorerProvider";
import type { OrbitRecord } from "@/lib/api/hasura";
import { LoadingScreen } from "@/components/organisms/LoadingScreen";
import { setExplorerEntry } from "@/lib/solar/entry";
import { LandingShare } from "./Share";
import { useDiscoveryCount } from "./DiscoveryCount";
import type { Category } from "@/lib/api/craft";

const Scene = dynamic(() => import("@/components/organisms/Explorer/Scene"), {
  ssr: false,
});

function BackgroundScene() {
  const [catalogReady, setCatalogReady] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const onReady = useCallback(() => setSceneReady(true), []);
  const { setCount, setLeaving } = useDiscoveryCount();
  const [destination, setDestination] = useState<string>();
  const router = useRouter();
  useEffect(() => {
    // Restore the landing overlay when Next reactivates a cached homepage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDestination(undefined);
    setLeaving(false);
  }, [setLeaving]);
  const complete = useCallback(() => {
    if (!destination) return;
    setExplorerEntry({ position: [10, 5, 0], target: [0, 0, 0] });
    router.push(destination);
  }, [destination, router]);
  const { setCatalog, cameraViewRef } = useExplorer();
  useEffect(() => {
    const navigate = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element ? event.target.closest("a") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download"))
        return;
      const url = new URL(link.href);
      if (
        url.origin === window.location.origin &&
        /^\/(?:en\/|es\/)?explorer\/?$/.test(url.pathname) &&
        cameraViewRef.current
      ) {
        event.preventDefault();
        event.stopPropagation();
        if (destination) return;
        setLeaving(true);
        setDestination(url.pathname + url.search);
        router.prefetch(url.pathname + url.search);
      }
    };
    document.addEventListener("click", navigate, true);
    return () => document.removeEventListener("click", navigate, true);
  }, [cameraViewRef, destination, router, setLeaving]);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/catalog?quality=low", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as {
          mpc_orbits?: OrbitRecord[];
          rubin_discoveries_count?: unknown;
        };
        if (controller.signal.aborted) return;
        const count = data.rubin_discoveries_count;
        setCount(
          typeof count === "number" && Number.isSafeInteger(count) && count >= 0
            ? count
            : null,
        );
        if (Array.isArray(data.mpc_orbits)) setCatalog(data.mpc_orbits);
      })
      .catch(() => {
        /* Keep the planetary scene when the catalog is unavailable. */
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogReady(true);
      });
    return () => controller.abort();
  }, [setCatalog, setCount]);
  return (
    <>
      {(!catalogReady || !sceneReady) && <LoadingScreen />}
      <Scene
        landing
        onReady={onReady}
        departing={Boolean(destination)}
        onDepartureComplete={complete}
      />
    </>
  );
}

export function LandingBackground({
  initial,
  categories,
}: {
  initial: OrbitRecord[];
  categories: Category[];
}) {
  return (
    <ExplorerProvider
      landing
      initial={initial}
      entries={[]}
      categoryEntries={categories}
    >
      <BackgroundScene />
      <LandingShare />
    </ExplorerProvider>
  );
}
