"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ExplorerProvider } from "@/contexts/ExplorerProvider";
import type { OrbitRecord } from "@/lib/api/hasura";
import type { SolarEntry, Category } from "@/lib/api/craft";
import {
  DiscoveryProvider,
  useDiscoveryCount,
} from "@/components/templates/Landing/DiscoveryCount";
import { LandingShare } from "@/components/templates/Landing/Share";
import { ExplorerSurface } from ".";

function SharedSurface({
  children,
  landing,
  contentError,
}: {
  children: ReactNode;
  landing: boolean;
  contentError?: boolean;
}) {
  const router = useRouter();
  const { setCount, setLeaving } = useDiscoveryCount();
  const [destination, setDestination] = useState<string>();
  useEffect(() => {
    // A return to the homepage restores its overlay and departure control.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDestination(undefined);
    setLeaving(false);
  }, [landing, setLeaving]);
  const complete = useCallback(() => {
    if (destination) router.push(destination);
  }, [destination, router]);
  useEffect(() => {
    if (!landing) return;
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
        url.origin !== window.location.origin ||
        !/^\/(?:en\/|es\/)?explorer\/?$/.test(url.pathname)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      if (destination) return;
      setLeaving(true);
      setDestination(url.pathname + url.search);
      router.prefetch(url.pathname + url.search);
    };
    document.addEventListener("click", navigate, true);
    return () => document.removeEventListener("click", navigate, true);
  }, [landing, destination, router, setLeaving]);
  return (
    <>
      <ExplorerSurface
        landing={landing}
        departing={landing && Boolean(destination)}
        onDepartureComplete={complete}
        onDiscoveryCount={setCount}
        contentError={contentError}
      >
        {children}
      </ExplorerSurface>
      {landing && <LandingShare />}
    </>
  );
}

export function SharedExplorer({
  initial,
  entries,
  categoryEntries,
  contentError,
  children,
}: {
  initial: OrbitRecord[];
  entries: SolarEntry[];
  categoryEntries: Category[];
  contentError?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const landing = !/\/explorer\/?$/.test(pathname);
  return (
    <DiscoveryProvider>
      <ExplorerProvider
        initial={initial}
        entries={entries}
        categoryEntries={categoryEntries}
        landing={landing}
      >
        <SharedSurface landing={landing} contentError={contentError}>
          {children}
        </SharedSurface>
      </ExplorerProvider>
    </DiscoveryProvider>
  );
}
