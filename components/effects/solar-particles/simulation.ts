import {
  BufferAttribute,
  DataTexture,
  RGBAFormat,
  type WebGLRenderer,
  BufferGeometry,
  FloatType,
  NearestFilter,
  OrthographicCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderTarget,
} from "three";
import type { OrbitRecord } from "@/lib/api/hasura";
import { composeShader } from "@/lib/shaders";
import vertex from "./shaders/gpu_sim.vert";
import fragment from "./shaders/gpu_sim.frag";
import { GAUSSIAN_K, DEG, orbitPosition } from "@/lib/solar/orbits";

/** One orbital record per floating-point texel. The original GPU shaders
 * retain their 1,000-units-per-AU convention; the draw shader converts sampled centers to AU.
 * Sampling texel centers avoids the legacy edge/interpolation ambiguity.
 */
export function createSimulation(records: OrbitRecord[]) {
  const width = Math.max(1, Math.ceil(Math.sqrt(records.length)));
  const height = Math.max(1, Math.ceil(records.length / width));
  const geometry = new BufferGeometry();
  const positions = new Float32Array(records.length * 3);
  const uv = new Float32Array(records.length * 2);
  records.forEach((_, index) => {
    const x = index % width;
    const y = Math.floor(index / width);
    positions.set([x + 0.5, y + 0.5, 0], index * 3);
    uv.set([(x + 0.5) / width, (y + 0.5) / height], index * 2);
  });
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  const fields: Record<string, (record: OrbitRecord) => number> = {
    N: (r) => r.node,
    a: (r) => r.a,
    e: (r) => r.e,
    i: (r) => r.i,
    w: (r) => r.argperi,
    M: (r) => r.mean_anomaly,
    n: (r) => r.mean_motion ?? GAUSSIAN_K / Math.abs(r.a) ** 1.5 / DEG,
    Tp: (r) => r.peri_time ?? r.epoch_mjd,
    q: (r) => r.q,
    epoch: (r) => r.epoch_mjd,
    type: (r) => (r.e < 0.98 ? 0 : r.e === 1 ? 1 : r.e < 1.2 ? 2 : 3),
    alive: () => 1,
  };
  for (const [name, getValue] of Object.entries(fields)) {
    geometry.setAttribute(
      name,
      new BufferAttribute(Float32Array.from(records, getValue), 1),
    );
  }
  const material = new ShaderMaterial({
    vertexShader: composeShader(vertex),
    fragmentShader: composeShader(fragment),
    uniforms: { d: { value: 0 } },
    depthTest: false,
    depthWrite: false,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  const scene = new Scene();
  scene.add(points);
  const camera = new OrthographicCamera(0, width, height, 0, 0.1, 2);
  camera.position.z = 1;
  const target = new WebGLRenderTarget(width, height, {
    type: FloatType,
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    depthBuffer: false,
  });
  return {
    uv,
    texture: target.texture,
    update(gl: WebGLRenderer, mjd: number) {
      material.uniforms.d.value = mjd;
      const previous = gl.getRenderTarget();
      try {
        gl.setRenderTarget(target);
        gl.render(scene, camera);
      } finally {
        gl.setRenderTarget(previous);
      }
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      target.dispose();
    },
  };
}

/** WebGL2 can sample float textures even without float render-target support.
 * Keep the exact same drawing shader and geometry on the CPU fallback path.
 */
export function createCPUSimulation(records: OrbitRecord[]) {
  const width = Math.max(1, Math.ceil(Math.sqrt(records.length)));
  const height = Math.max(1, Math.ceil(records.length / width));
  const positions = new Float32Array(width * height * 4);
  const uv = new Float32Array(records.length * 2);
  records.forEach((_, index) => {
    uv.set(
      [
        ((index % width) + 0.5) / width,
        (Math.floor(index / width) + 0.5) / height,
      ],
      index * 2,
    );
  });
  const texture = new DataTexture(
    positions,
    width,
    height,
    RGBAFormat,
    FloatType,
  );
  let lastDate: number | undefined;
  return {
    uv,
    texture,
    update(_gl: WebGLRenderer, mjd: number) {
      if (lastDate === mjd) return;
      records.forEach((record, index) => {
        orbitPosition(record, mjd)
          .multiplyScalar(1000)
          .toArray(positions, index * 4);
        positions[index * 4 + 3] = 1;
      });
      texture.needsUpdate = true;
      lastDate = mjd;
    },
    dispose() {
      texture.dispose();
    },
  };
}
