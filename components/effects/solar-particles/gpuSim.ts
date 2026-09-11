import {
  BufferAttribute,
  BufferGeometry,
  FloatType,
  NearestFilter,
  OrthographicCamera,
  Points,
  Scene,
  ShaderMaterial,
  Texture,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { EPOCH } from "@/lib/solar/constants";
import { OrbitType, type OrbitElements } from "@/lib/solar/types";
import { GPU_SIM_SIZES, type SimQuality } from "@/lib/solar/quality";
import vertexShader from "./gpu_sim.vert";
import fragmentShader from "./gpu_sim.frag";

/**
 * GPU orbit propagation.
 *
 * Ported from `gfx/solar/GPUSim.ts`. Propagating hundreds of thousands of
 * Keplerian orbits on the CPU each frame is impossible, so the work is done
 * in a fragment shader:
 *
 *  - a float render target holds one texel per object;
 *  - a Points geometry places exactly one vertex on each texel, carrying that
 *    object's orbital elements as vertex attributes;
 *  - an orthographic camera frames the target 1:1 so the mapping is exact;
 *  - `gpu_sim.frag` solves the orbit for the current date and writes the
 *    heliocentric position into the texel's RGB.
 *
 * The particle mesh then reads positions straight out of that texture, so
 * object positions never round-trip through the CPU.
 *
 * This is a stateless compute pass, not a ping-pong simulation: each frame is
 * solved from the elements and the date alone, so there is no second buffer
 * and no accumulated drift.
 */

/** Per-object float attributes uploaded to the sim. */
const ELEMENT_ATTRIBUTES = [
  "N",
  "a",
  "e",
  "i",
  "w",
  "M",
  "n",
  "Tp",
  "q",
  "epoch",
  "type",
] as const;

type ElementAttribute = (typeof ELEMENT_ATTRIBUTES)[number];

/** Maps normalised elements onto the float the shader expects. */
const attributeValue = (el: OrbitElements, key: ElementAttribute): number => {
  switch (key) {
    case "epoch":
      return el.epoch ?? EPOCH;
    case "type":
      return el.type ?? OrbitType.Elliptical;
    case "Tp":
      return el.Tp ?? 0;
    default:
      return el[key] ?? 0;
  }
};

export interface GPUSimOptions {
  renderer: WebGLRenderer;
  quality: SimQuality;
}

export class GPUSim {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera: OrthographicCamera;
  private target: WebGLRenderTarget;
  private points: Points;
  private material: ShaderMaterial;

  quality: SimQuality;
  capacity: number;
  /** Number of objects currently uploaded. */
  count = 0;

  constructor({ renderer, quality }: GPUSimOptions) {
    this.renderer = renderer;
    this.quality = quality;

    const { width, height } = GPU_SIM_SIZES[quality];
    this.capacity = width * height;

    // Float precision is essential: positions range from a few scene units
    // out to 1e6 for the sentinel used by inactive texels, which an 8-bit
    // target cannot represent at all. Nearest filtering because each texel is
    // one object -- any interpolation would blend two unrelated orbits.
    this.target = new WebGLRenderTarget(width, height, {
      type: FloatType,
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      depthBuffer: false,
      stencilBuffer: false,
    });

    this.camera = new OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      1,
      100
    );
    this.camera.position.z = 10;
    this.scene.add(this.camera);

    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { d: { value: 0 } },
    });

    this.points = new Points(this.createGeometry(width, height), this.material);
    // The grid is built in [0, width) but the camera is centred on the
    // origin, so shift it half a viewport to align vertex to texel centre.
    this.points.position.x = -width / 2 + 1;
    this.points.position.y = -height / 2 + 1;
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  private createGeometry(width: number, height: number): BufferGeometry {
    const geometry = new BufferGeometry();
    const count = width * height;

    const positions = new Float32Array(count * 3);
    let p = 0;
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        positions[p++] = i;
        positions[p++] = j;
        positions[p++] = 0;
      }
    }

    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute(
      "alive",
      new BufferAttribute(new Float32Array(count), 1)
    );

    for (const key of ELEMENT_ATTRIBUTES) {
      geometry.setAttribute(
        key,
        new BufferAttribute(new Float32Array(count), 1)
      );
    }

    return geometry;
  }

  get texture(): Texture {
    return this.target.texture;
  }

  /**
   * Uploads orbital elements. Objects beyond the tier's capacity are dropped;
   * texels past the end are marked dead and parked far outside the scene.
   */
  setData(data: Array<OrbitElements>): void {
    const geometry = this.points.geometry;
    const count = Math.min(this.capacity, data.length);
    this.count = count;

    const alive = geometry.attributes.alive.array as Float32Array;
    alive.fill(1, 0, count);
    alive.fill(0, count);
    geometry.attributes.alive.needsUpdate = true;

    for (const key of ELEMENT_ATTRIBUTES) {
      const attribute = geometry.attributes[key];
      const array = attribute.array as Float32Array;

      for (let i = 0; i < count; i++) {
        array[i] = attributeValue(data[i], key);
      }

      attribute.needsUpdate = true;
    }
  }

  /** Solves every orbit for date `d` (MJD) into the target texture. */
  render(d: number): void {
    this.material.uniforms.d.value = d;

    const previousTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.target);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(previousTarget);
  }

  dispose(): void {
    this.points.geometry.dispose();
    this.material.dispose();
    this.target.dispose();
    this.scene.clear();
  }
}
