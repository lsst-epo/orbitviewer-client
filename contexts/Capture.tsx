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
 * Bridges a capture request from the DOM overlay to the render loop.
 *
 * The share dialog lives outside the Canvas, so it cannot read the drawing
 * buffer itself: without `preserveDrawingBuffer` the canvas is empty by the
 * time any handler outside the frame looks at it, and turning that flag on
 * would cost every frame for a feature used once in a session.
 *
 * Instead a request is parked here and `<SceneCapture>` fulfils it from
 * inside `useFrame`, immediately after the compositor has drawn, when the
 * buffer is still valid.
 */

export interface CaptureRequest {
  resolve: (canvas: HTMLCanvasElement | null) => void;
}

interface CaptureValue {
  /** Resolves with a snapshot of the scene, or null if there is no canvas. */
  capture: () => Promise<HTMLCanvasElement | null>;
  /** Read by the in-canvas fulfiller; not for general use. */
  pending: React.RefObject<CaptureRequest | null>;
}

const CaptureContext = createContext<CaptureValue | null>(null);

const CaptureProvider: FunctionComponent<PropsWithChildren> = ({
  children,
}) => {
  const pending = useRef<CaptureRequest | null>(null);

  const capture = useCallback(
    () =>
      new Promise<HTMLCanvasElement | null>((resolve) => {
        // One in flight at a time: a second request supersedes the first
        // rather than queueing behind it, since both would return the same
        // frame anyway.
        pending.current?.resolve(null);
        pending.current = { resolve };
      }),
    []
  );

  const value = useMemo<CaptureValue>(() => ({ capture, pending }), [capture]);

  return (
    <CaptureContext.Provider value={value}>{children}</CaptureContext.Provider>
  );
};

export const useCapture = (): CaptureValue => {
  const context = useContext(CaptureContext);

  if (!context) {
    throw new Error("useCapture must be used within a CaptureProvider");
  }

  return context;
};

export default CaptureProvider;
