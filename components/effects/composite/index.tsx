"use client";
import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useExplorer } from "@/contexts/ExplorerProvider";
import { createPipeline } from "./pipeline";

/** A positive frame priority owns the final draw after orbital/cloud updates. */
export function Composite() {
  const { quality } = useExplorer();
  const size = useThree((state) => state.size);
  const dpr = useThree((state) => state.viewport.dpr);
  const pipeline = useMemo(() => createPipeline(), []);
  useEffect(() => {
    pipeline.resize(
      Math.round(size.width * dpr),
      Math.round(size.height * dpr),
    );
  }, [pipeline, size, dpr]);
  useEffect(() => () => pipeline.dispose(), [pipeline]);
  useFrame(
    ({ gl, scene, camera }) =>
      pipeline.render(gl, scene, camera, quality !== "low"),
    1,
  );
  return null;
}
