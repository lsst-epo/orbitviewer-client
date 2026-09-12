"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type FunctionComponent,
  type PropsWithChildren,
} from "react";

/**
 * Bridges the on-screen map controls to the camera.
 *
 * Same shape as the capture and benchmark bridges: the buttons are DOM, the
 * camera only exists inside the render loop, and a ref carries the intent
 * across without a React render per frame.
 *
 * Zoom is held rather than stepped, which is what the legacy's
 * `attachUpDownActions` gave its buttons -- press and the view keeps moving,
 * release and it stops. A click still nudges, because the press and release
 * bracket at least one frame.
 */

/** -1 zooms in, +1 out, 0 idle. Matches the legacy's `controls.zoom`. */
export type ZoomDirection = -1 | 0 | 1;

interface SceneControlsValue {
  /** Read every frame by the camera. */
  zoomRef: React.RefObject<ZoomDirection>;
  /** Set by Recentre, cleared by the camera once it has acted. */
  recenterRef: React.RefObject<boolean>;
  setZoom: (direction: ZoomDirection) => void;
  recenter: () => void;
}

const SceneControlsContext = createContext<SceneControlsValue | null>(null);

const SceneControlsProvider: FunctionComponent<PropsWithChildren> = ({
  children,
}) => {
  const zoomRef = useRef<ZoomDirection>(0);
  const recenterRef = useRef(false);

  const setZoom = useCallback((direction: ZoomDirection) => {
    zoomRef.current = direction;
  }, []);

  const recenter = useCallback(() => {
    recenterRef.current = true;
  }, []);

  const value = useMemo<SceneControlsValue>(
    () => ({ zoomRef, recenterRef, setZoom, recenter }),
    [setZoom, recenter]
  );

  return (
    <SceneControlsContext.Provider value={value}>
      {children}
    </SceneControlsContext.Provider>
  );
};

export const useSceneControls = (): SceneControlsValue => {
  const context = useContext(SceneControlsContext);

  if (!context) {
    throw new Error(
      "useSceneControls must be used within a SceneControlsProvider"
    );
  }

  return context;
};

export default SceneControlsProvider;
