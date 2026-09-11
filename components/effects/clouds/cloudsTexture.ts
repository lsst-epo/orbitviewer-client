import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Texture,
  TextureLoader,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import vertexShader from "./clouds.vert";
import fragmentShader from "./clouds.frag";
import cloudsMap from "./earth_clouds.webp";

/**
 * Procedurally generated cloud layer.
 *
 * Ported from `gfx/planets/EarthClouds.ts`. This is not a texture lookup: the
 * fragment shader evaluates 4D fbm noise in polar coordinates and renders it
 * into an offscreen target, which is then sampled as Earth's cloud map. The
 * fourth noise dimension is time, so the cloud field evolves as the simulation
 * clock runs rather than merely rotating.
 *
 * Regeneration is throttled. The noise is expensive (six fbm octaves over a
 * megapixel target) and the clouds only need to change on a scale of simulated
 * hours, so re-rendering every frame would be waste.
 */

/** Aspect is fixed at 2:1 -- this is an equirectangular map. */
const DEFAULT_WIDTH = 1024;

/**
 * Minimum simulated-time delta between regenerations, in the clock's own
 * units (seconds of simulated time). Matches the legacy threshold.
 */
const TIME_THRESHOLD = 100;

export class CloudsTexture {
  private target: WebGLRenderTarget;
  private material: ShaderMaterial;
  private scene = new Scene();
  private camera = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
  private quad: Mesh;

  private lastRenderedTime = Number.NEGATIVE_INFINITY;

  /** Forces one regeneration regardless of the time threshold. */
  forceRender = true;

  constructor(width: number = DEFAULT_WIDTH) {
    this.target = new WebGLRenderTarget(width, width / 2, {
      depthBuffer: false,
      stencilBuffer: false,
    });

    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        // The bundled map is a base layer the shader can blend against. The
        // ported shader currently derives everything from noise and leaves it
        // unsampled, but the uniform is part of its interface.
        map: { value: new TextureLoader().load(cloudsMap.src) },
      },
    });

    this.camera.position.z = 1;
    this.quad = new Mesh(new PlaneGeometry(1, 1), this.material);
    this.scene.add(this.quad);
  }

  get texture(): Texture {
    return this.target.texture;
  }

  setSize(width: number): void {
    this.target.setSize(width, width / 2);
    this.forceRender = true;
  }

  /**
   * Regenerates the cloud field if enough simulated time has passed.
   * `time` is the simulation clock's elapsed time, not wall clock.
   */
  render(renderer: WebGLRenderer, time: number): void {
    if (
      !this.forceRender &&
      Math.abs(time - this.lastRenderedTime) < TIME_THRESHOLD
    ) {
      return;
    }

    this.lastRenderedTime = time;
    this.material.uniforms.time.value = time;

    const previousTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(this.target);
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(previousTarget);

    this.forceRender = false;
  }

  dispose(): void {
    this.target.dispose();
    this.material.uniforms.map.value?.dispose();
    this.material.dispose();
    this.quad.geometry.dispose();
    this.scene.clear();
  }
}
