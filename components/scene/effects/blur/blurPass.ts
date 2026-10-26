import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  RawShaderMaterial,
  Scene,
  Texture,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import vertexShader from "./fbo.vert";
import fragmentShader from "./blur.frag";

/** Kernel width. Selects the 5-, 9- or 13-tap variant in blur.frag. */
export enum BlurQuality {
  Low = 0,
  Medium = 1,
  High = 2,
}

export interface BlurSettings {
  /** Render-target scale relative to the source. Below 1 blurs cheaper and wider. */
  scale: number;
  /** Tap spacing, in source pixels. */
  radius: number;
  quality: BlurQuality;
  /** Number of alternating 1D passes. */
  iterations: number;
}

/** Render targets must be whole pixels. */
const scaled = (value: number, scale: number): number =>
  Math.max(1, Math.round(value * scale));

export const DEFAULT_BLUR: BlurSettings = {
  scale: 1,
  radius: 1,
  quality: BlurQuality.Low,
  iterations: 4,
};

export class BlurPass {
  private read: WebGLRenderTarget;
  private write: WebGLRenderTarget;
  private material: RawShaderMaterial;
  private scene = new Scene();
  private camera: OrthographicCamera;
  private quad: Mesh;

  source: Texture;
  scale: number;
  radius: number;
  quality: BlurQuality;
  iterations: number;

  private width: number;
  private height: number;

  constructor(
    source: Texture,
    width: number,
    height: number,
    settings: BlurSettings = DEFAULT_BLUR
  ) {
    this.source = source;
    this.scale = settings.scale ?? DEFAULT_BLUR.scale;
    this.radius = settings.radius ?? DEFAULT_BLUR.radius;
    this.quality = settings.quality ?? DEFAULT_BLUR.quality;
    this.iterations = settings.iterations ?? DEFAULT_BLUR.iterations;
    this.width = width;
    this.height = height;

    this.read = new WebGLRenderTarget(
      scaled(width, this.scale),
      scaled(height, this.scale),
      { depthBuffer: false, stencilBuffer: false }
    );
    this.write = this.read.clone();

    // RawShaderMaterial is required, not incidental: the shaders are ESSL 1.00
    // and three adds no version directive or prefix to raw materials.
    this.material = new RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        resolution: { value: new Vector2(width, height) },
        direction: { value: new Vector2() },
        scale: { value: this.scale },
        tMap: { value: null },
        mode: { value: this.quality },
        isGlow: { value: false },
      },
    });

    const w = (this.scale * width) / 2;
    const h = (this.scale * height) / 2;
    this.camera = new OrthographicCamera(-w, w, h, -h, 0, 100);
    this.camera.position.z = 1;
    this.scene.add(this.camera);

    this.quad = new Mesh(new PlaneGeometry(1, 1), this.material);
    this.quad.scale.set(width * this.scale, height * this.scale, 1);
    this.scene.add(this.quad);
  }

  get texture(): Texture {
    return this.read.texture;
  }

  get target(): WebGLRenderTarget {
    return this.read;
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;

    this.read.setSize(scaled(width, this.scale), scaled(height, this.scale));
    this.write.setSize(scaled(width, this.scale), scaled(height, this.scale));

    const w = (this.scale * width) / 2;
    const h = (this.scale * height) / 2;
    this.camera.left = -w;
    this.camera.right = w;
    this.camera.top = h;
    this.camera.bottom = -h;
    this.camera.updateProjectionMatrix();

    this.quad.scale.set(width * this.scale, height * this.scale, 1);
    this.material.uniforms.resolution.value.set(width, height);
    this.material.uniforms.scale.value = this.scale;
  }

  /** Re-applies settings that change target dimensions. */
  applySettings(settings: Partial<BlurSettings>): void {
    if (settings.scale !== undefined) this.scale = settings.scale;
    if (settings.radius !== undefined) this.radius = settings.radius;
    if (settings.quality !== undefined) this.quality = settings.quality;
    if (settings.iterations !== undefined)
      this.iterations = settings.iterations;

    this.setSize(this.width, this.height);
  }

  private swap(): void {
    const tmp = this.write;
    this.write = this.read;
    this.read = tmp;
  }

  private pass(
    renderer: WebGLRenderer,
    source: Texture,
    destination: WebGLRenderTarget,
    dx: number,
    dy: number
  ): void {
    renderer.setRenderTarget(destination);
    this.material.uniforms.mode.value = this.quality;
    this.material.uniforms.direction.value.set(dx, dy);
    this.material.uniforms.tMap.value = source;
    renderer.render(this.scene, this.camera);
  }

  /** Blurs `source` into this pass's own target. The result is `texture`. */
  render(renderer: WebGLRenderer): void {
    this.pass(renderer, this.source, this.write, this.radius, 0);
    this.swap();

    for (let i = 1; i < this.iterations; i++) {
      const horizontal = i % 2 === 0;
      this.pass(
        renderer,
        this.read.texture,
        this.write,
        horizontal ? this.radius : 0,
        horizontal ? 0 : this.radius
      );
      this.swap();
    }
  }

  dispose(): void {
    this.read.dispose();
    this.write.dispose();
    this.material.dispose();
    this.quad.geometry.dispose();
    this.scene.clear();
  }
}
