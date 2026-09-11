"use client";

import { Suspense, type FunctionComponent, type PropsWithChildren } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname } from "@/lib/i18n/navigation";
import ExplorerProvider, {
  type ExplorerProviderProps,
} from "@/contexts/Explorer";
import SolarDataProvider from "@/contexts/SolarData";
import CaptureProvider from "@/contexts/Capture";
import BenchmarkProvider from "@/contexts/Benchmark";
import SceneControlsProvider from "@/contexts/SceneControls";
import SolarClockProvider from "@/contexts/SolarClock";
import { parseExplorerParams } from "@/lib/explorer/searchParams";
import SceneCanvas from "@/components/templates/Explorer/SceneCanvas";
import styles from "./styles.module.css";

/**
 * The persistent viewer shell: one WebGL context and one copy of the orbital
 * data, shared by every route that shows the scene.
 *
 * This exists because of what the scene costs to start. The MPC dataset is
 * 6 MB at the lowest tier and 360 MB at the highest, served uncompressed
 * (`lib/solar/quality.ts`), and the browser downloads it rather than the
 * server. Mounting the canvas per route would pay that again on every
 * navigation between the splash, the explorer and a guided experience.
 *
 * The legacy got this for free by being a single page whose canvas never
 * unmounted. The App Router equivalent is a layout: `/`, `/explorer`,
 * `/guided-experiences` and a tour are siblings inside the `(viewer)` route
 * group, so React keeps this subtree mounted as the reader moves between
 * them and only the overlay below `children` is swapped.
 *
 * It also moves the download somewhere useful. The splash is the one screen
 * a reader dwells on without needing anything yet, which is exactly when the
 * dataset should be arriving -- the port previously waited for the click and
 * then showed a progress bar.
 */

export interface ViewerProps
  extends Omit<ExplorerProviderProps, "initialParams"> {
  locale: string;
}

/**
 * Search params reach this through the hook rather than a server prop,
 * because a layout is not passed `searchParams` -- only a page is. The
 * provider seeds its state from this once and owns it thereafter, so reading
 * it here is equivalent to the prop the pages used to pass down.
 */
const ViewerState: FunctionComponent<PropsWithChildren<ViewerProps>> = ({
  locale,
  children,
  ...data
}) => {
  const searchParams = useSearchParams();
  // Locale-stripped, so the splash is `/` in either language.
  const landing = usePathname() === "/";
  const initialParams = parseExplorerParams(
    Object.fromEntries(searchParams.entries())
  );

  return (
    <ExplorerProvider initialParams={initialParams} {...data}>
      <SolarDataProvider dataFileUrls={data.dataFileUrls}>
        <CaptureProvider>
          <BenchmarkProvider>
            <SceneControlsProvider landing={landing}>
              <SolarClockProvider
                initialDate={
                  initialParams.date ? new Date(initialParams.date) : undefined
                }
                initialHoursPerSecond={initialParams.timeScale ?? 0}
              >
                <div className={styles.viewer}>
                  <SceneCanvas />
                  {children}
                </div>
              </SolarClockProvider>
            </SceneControlsProvider>
          </BenchmarkProvider>
        </CaptureProvider>
      </SolarDataProvider>
    </ExplorerProvider>
  );
};

/** `useSearchParams` requires a boundary, or the production build fails. */
const Viewer: FunctionComponent<PropsWithChildren<ViewerProps>> = (props) => (
  <Suspense fallback={null}>
    <ViewerState {...props} />
  </Suspense>
);

export default Viewer;
