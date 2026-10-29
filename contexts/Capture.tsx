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
