"use client";

import { Suspense, type FunctionComponent } from "react";
import { Canvas } from "@react-three/fiber";
import { CAMERA_CLIP } from "@/components/celestial-bodies/camera";
import SceneCapture from "@/components/effects/capture";
import SceneBenchmark from "@/components/effects/benchmark";
import Scene from "./Scene";
import styles from "./styles.module.css";

/**
 * The WebGL context itself, split out of `Explorer` so the viewer shell can
 * own it. It is mounted once per visit, above the routes that show the
 * scene, and must not be rendered anywhere else -- see
 * `components/templates/Viewer`.
 */
const SceneCanvas: FunctionComponent = () => (
  <Canvas
    className={styles.canvas}
    camera={{
      fov: 35,
      near: CAMERA_CLIP.near,
      far: CAMERA_CLIP.far,
    }}
    gl={{
      // The scene spans six orders of magnitude, from a 24-unit near limit
      // to 3,000,000 units. A linear depth buffer z-fights badly across
      // that range.
      logarithmicDepthBuffer: true,
      antialias: true,
      powerPreference: "high-performance",
    }}
    // Rendering is on-demand elsewhere, but the clock advances every frame,
    // so the loop always runs.
    frameloop="always"
  >
    <color attach="background" args={["#000000"]} />
    <Suspense fallback={null}>
      <Scene />
      <SceneCapture />
      <SceneBenchmark />
    </Suspense>
  </Canvas>
);

export default SceneCanvas;
