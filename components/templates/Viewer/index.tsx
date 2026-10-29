"use client";

import {
  Suspense,
  type FunctionComponent,
  type PropsWithChildren,
} from "react";
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
import SceneCanvas from "@/components/scene/SceneCanvas";
import styles from "./styles.module.css";

export interface ViewerProps extends Omit<
  ExplorerProviderProps,
  "initialParams"
> {
  locale: string;
}

const ViewerState: FunctionComponent<PropsWithChildren<ViewerProps>> = ({
  locale,
  children,
  ...data
}) => {
  const searchParams = useSearchParams();
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
