"use client";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { ExplorerProvider, useExplorer } from "@/contexts/ExplorerProvider";
import type { OrbitRecord } from "@/lib/api/hasura";
import type { Category } from "@/lib/api/craft";

const Scene = dynamic(() => import("@/components/organisms/Explorer/Scene"), {
  ssr: false,
});

function BackgroundScene() {
  const { setCatalog } = useExplorer();
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/catalog?quality=low", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as { mpc_orbits?: OrbitRecord[] };
        if (!controller.signal.aborted && Array.isArray(data.mpc_orbits))
          setCatalog(data.mpc_orbits);
      })
      .catch(() => {
        /* Keep the planetary scene when the catalog is unavailable. */
      });
    return () => controller.abort();
  }, [setCatalog]);
  return <Scene />;
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
      initial={initial}
      entries={[]}
      categoryEntries={categories}
    >
      <BackgroundScene />
    </ExplorerProvider>
  );
}
