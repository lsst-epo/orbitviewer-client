"use client";
import { useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Scene,
  Mesh,
  PlaneGeometry,
  OrthographicCamera,
  ShaderMaterial,
  WebGLRenderTarget,
} from "three";
import { useExplorer } from "@/contexts/ExplorerProvider";
import { composeShader } from "@/lib/shaders";
import vertex from "./earth_clouds.vert";
import fragment from "./earth_clouds.frag";

/** Replace @fils/gfx's offscreen renderer with an owned Three render target.
 * Save and restore the current render target so this pass composes with R3F.
 */
export function useCloudTexture() {
  const { gl } = useThree();
  const { quality } = useExplorer();
  const width = quality === "ultra" ? 2048 : quality === "high" ? 1024 : 512;
  const resources = useMemo(() => {
    const target = new WebGLRenderTarget(width, width / 2);
    const material = new ShaderMaterial({
      vertexShader: composeShader(vertex),
      fragmentShader: composeShader(fragment),
      uniforms: { time: { value: 0 } },
    });
    const geometry = new PlaneGeometry(2, 2);
    const scene = new Scene();
    scene.add(new Mesh(geometry, material));
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    return { target, material, geometry, scene, camera };
  }, [width]);
  useFrame(({ clock }) => {
    // Three uniforms are intentionally mutable outside React rendering.
    // eslint-disable-next-line react-hooks/immutability
    resources.material.uniforms.time.value = clock.elapsedTime * 1000;
    const previous = gl.getRenderTarget();
    gl.setRenderTarget(resources.target);
    gl.render(resources.scene, resources.camera);
    gl.setRenderTarget(previous);
  }, -1);
  useEffect(
    () => () => {
      resources.target.dispose();
      resources.material.dispose();
      resources.geometry.dispose();
    },
    [resources],
  );
  return resources.target.texture;
}
