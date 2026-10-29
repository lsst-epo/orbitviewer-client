"use client";

import type { FunctionComponent } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useBenchmark } from "@/contexts/Benchmark";

/** Below the compositor, so the delta is for a fully drawn frame. */
const BENCHMARK_PRIORITY = -3;

/** Touch devices get the smallest dataset whatever they benchmark at. */
const isTouch = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: coarse)").matches;

const SceneBenchmark: FunctionComponent = () => {
  const size = useThree((state) => state.size);
  const { running, report } = useBenchmark();

  useFrame((_, delta) => {
    const benchmark = running.current;
    if (!benchmark) return;

    benchmark.sample(delta);

    if (benchmark.finished) {
      report(benchmark.result(isTouch() || size.width <= 768));
    }
  }, BENCHMARK_PRIORITY);

  return null;
};

export default SceneBenchmark;
