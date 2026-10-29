"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type FunctionComponent,
  type PropsWithChildren,
} from "react";
import { FrameBenchmark, type BenchmarkResult } from "@/lib/solar/benchmark";

interface BenchmarkValue {
  result: BenchmarkResult | null;
  /** Starts a run; resolves through `result`. Ignored while one is running. */
  start: () => void;
  /** Read by the in-canvas sampler; not for general use. */
  running: React.RefObject<FrameBenchmark | null>;
  report: (result: BenchmarkResult) => void;
}

const BenchmarkContext = createContext<BenchmarkValue | null>(null);

const BenchmarkProvider: FunctionComponent<PropsWithChildren> = ({
  children,
}) => {
  const running = useRef<FrameBenchmark | null>(null);
  const [result, setResult] = useState<BenchmarkResult | null>(null);

  const start = useCallback(() => {
    if (running.current) return;
    running.current = new FrameBenchmark();
  }, []);

  const report = useCallback((next: BenchmarkResult) => {
    running.current = null;
    setResult(next);
  }, []);

  const value = useMemo<BenchmarkValue>(
    () => ({ result, start, running, report }),
    [result, start, report]
  );

  return (
    <BenchmarkContext.Provider value={value}>
      {children}
    </BenchmarkContext.Provider>
  );
};

export const useBenchmark = (): BenchmarkValue => {
  const context = useContext(BenchmarkContext);

  if (!context) {
    throw new Error("useBenchmark must be used within a BenchmarkProvider");
  }

  return context;
};

export default BenchmarkProvider;
