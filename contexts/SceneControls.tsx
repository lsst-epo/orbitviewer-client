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

/** -1 zooms in, +1 out, 0 idle. Matches the legacy's `controls.zoom`. */
export type ZoomDirection = -1 | 0 | 1;

interface SceneControlsValue {
  /** Read every frame by the camera. */
  zoomRef: React.RefObject<ZoomDirection>;
  /** Set by Recentre, cleared by the camera once it has acted. */
  recenterRef: React.RefObject<boolean>;
  setZoom: (direction: ZoomDirection) => void;
  recenter: () => void;
  /**
   * Whether the splash is the current route. The camera frames the system
   * differently there, and needs to know when that stops being true so it
   * can fly out -- see `celestial-bodies/camera`.
   */
  landing: boolean;
}

const SceneControlsContext = createContext<SceneControlsValue | null>(null);

const SceneControlsProvider: FunctionComponent<
  PropsWithChildren<{ landing?: boolean }>
> = ({ children, landing = false }) => {
  const zoomRef = useRef<ZoomDirection>(0);
  const recenterRef = useRef(false);

  const setZoom = useCallback((direction: ZoomDirection) => {
    zoomRef.current = direction;
  }, []);

  const recenter = useCallback(() => {
    recenterRef.current = true;
  }, []);

  const value = useMemo<SceneControlsValue>(
    () => ({ zoomRef, recenterRef, setZoom, recenter, landing }),
    [setZoom, recenter, landing]
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
