"use client";

import { Suspense, useEffect, useState, type FunctionComponent } from "react";
import { Canvas } from "@react-three/fiber";
import { useExplorer } from "@/contexts/Explorer";
import SolarClockProvider, { useSolarClock } from "@/contexts/SolarClock";
import useClientTranslation from "@/lib/i18n/client";
import { CAMERA_CLIP } from "@/components/celestial-bodies/camera";
import Scene from "./Scene";
import styles from "./styles.module.css";

interface ExplorerProps {
  locale: string;
}

/**
 * Simulation date readout. Reads the throttled mirror, not the per-frame ref.
 *
 * Renders nothing until mounted. The clock seeds itself from `new Date()`, so
 * the server and client necessarily disagree about the current instant and
 * React reports a hydration mismatch on the <time> element. Deferring to after
 * hydration is correct rather than cosmetic: there is no "right" server value
 * for a live clock.
 */
const ClockReadout: FunctionComponent<{ locale: string }> = ({ locale }) => {
  const { displayDate, isLive } = useSolarClock();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <p className={styles.readout} />;

  return (
    <p className={styles.readout}>
      <time dateTime={displayDate.toISOString()}>
        {displayDate.toLocaleString(locale, {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "UTC",
        })}
      </time>
      {isLive && <span className={styles.live}> UTC · live</span>}
    </p>
  );
};

/**
 * Explorer shell: the WebGL canvas plus the UI layers drawn over it.
 *
 * The panels (object list, object detail, filters, search, time machine) are
 * still to come; they mount alongside the canvas rather than inside it.
 */
const Explorer: FunctionComponent<ExplorerProps> = ({ locale }) => {
  const { t } = useClientTranslation(locale);
  const { params, elements } = useExplorer();

  return (
    <main className={styles.explorer}>
      <SolarClockProvider
        initialDate={params.date ? new Date(params.date) : undefined}
        initialHoursPerSecond={params.timeScale ?? 0}
      >
        <Canvas
          className={styles.canvas}
          camera={{ fov: 35, near: CAMERA_CLIP.near, far: CAMERA_CLIP.far }}
          gl={{
            // The scene spans six orders of magnitude, from a 24-unit
            // near limit to 3,000,000 units. A linear depth buffer
            // z-fights badly across that range.
            logarithmicDepthBuffer: true,
            antialias: true,
            powerPreference: "high-performance",
          }}
          // Rendering is on-demand elsewhere, but the clock advances every
          // frame, so the loop always runs.
          frameloop="always"
        >
          <color attach="background" args={["#000000"]} />
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>

        <div className={styles.hud}>
          <ClockReadout locale={locale} />
          <p className={styles.meta}>
            {elements.length} {t("core.objects")}
            {params.object ? ` · ${params.object}` : ""}
          </p>
        </div>
      </SolarClockProvider>
    </main>
  );
};

export default Explorer;
