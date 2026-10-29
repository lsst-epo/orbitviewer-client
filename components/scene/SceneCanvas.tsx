"use client";

import { Suspense, type FunctionComponent } from "react";
import { Canvas } from "@react-three/fiber";
import { CAMERA_CLIP } from "@/components/scene/celestial-bodies/camera";
import SceneCapture from "@/components/scene/effects/capture";
import SceneBenchmark from "@/components/scene/effects/benchmark";
import Scene from "./Scene";
import styles from "./styles.module.css";

const SceneCanvas: FunctionComponent = () => (
  <Canvas
    className={styles.canvas}
    camera={{
      fov: 35,
      near: CAMERA_CLIP.near,
      far: CAMERA_CLIP.far,
    }}
    gl={{
      /* The scene spans six orders of magnitude; a linear buffer z-fights
         badly across that range. */
      logarithmicDepthBuffer: true,
      antialias: true,
      powerPreference: "high-performance",
    }}
    /* Not "demand": the clock advances every frame, so the loop always runs. */
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
