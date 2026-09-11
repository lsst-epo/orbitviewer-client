import {
  Camera,
  DataTexture,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  WebGLProgramParametersWithUniforms,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { BlurPass, type BlurQuality } from "@/components/effects/blur/blurPass";
import { FIRE_LAYER } from "./layers";
import type { GFXTier } from "@/lib/solar/quality";
import vertexShader from "./comp.vert";
import fragmentShader from "./comp.frag";

/**
 * Glow / bloom compositor.
 *
 * Ported from `gfx/core/RubinRenderer.ts`, which replaced the renderer's
 * render call outright. The pipeline per frame:
 *
 *   1. render the scene normally                -> sceneRT
 *   2. render it again in "glow" mode           -> glowRT
 *   3. blur the glow                            -> glowBlur.texture
 *   4. (reserved) sun-specific fire pass        -> fire
 *   5. composite all of the above               -> compRT
 *   6. blit to the screen or a target
 *
 * Step 2 is what `isGlow` / `hasGlow` and `getBloomColor()` throughout the
 * ported shaders exist for. Each material decides for itself which part of its
 * output is bright enough to bleed; meshes with no `isGlow` uniform are hidden
 * for that pass rather than contributing their full colour.
 */

/** A 1x1 transparent texture, stood in for passes that are not ported yet. */
const createEmptyTexture = (): DataTexture => {
  const texture = new DataTexture(
    new Uint8Array([0, 0, 0, 0]),
    1,
    1,
    RGBAFormat
  );
  texture.needsUpdate = true;
  return texture;
};

/** Tier sample counts are 1-based; three wants 0 to mean "not multisampled". */
const msaaSamples = (samples: number): number => (samples > 1 ? samples : 0);

interface GlowCapableMaterial extends ShaderMaterial {
  isCustomMaterial?: boolean;
  shaderRef?: WebGLProgramParametersWithUniforms | null;
}

/**
 * Sets a mesh's glow uniform, reporting whether it could.
 *
 * Materials come in two shapes. A plain ShaderMaterial owns its uniforms
 * directly. A patched built-in -- BodyMaterial, which extends
 * MeshStandardMaterial and rewrites the program in onBeforeCompile -- only
 * gains its uniforms once compiled, and they live on the cached shaderRef.
 */
function setGlowUniform(
  material: GlowCapableMaterial,
  value: boolean
): boolean {
  const uniforms = material.isCustomMaterial
    ? material.shaderRef?.uniforms
    : material.uniforms;

  if (!uniforms?.isGlow) return false;

  uniforms.isGlow.value = value;
  return true;
}

export class Compositor {
  private renderer: WebGLRenderer;

  private sceneRT: WebGLRenderTarget;
  private glowRT: WebGLRenderTarget;
  private compRT: WebGLRenderTarget;
  private sunRT: WebGLRenderTarget;
  private glowBlur: BlurPass;
  private sunBlur: BlurPass;

  private compMaterial: ShaderMaterial;
  private quadScene = new Scene();
  // Frustum deliberately deeper than the quad's distance from the camera:
  // at far = 1 the quad would sit exactly on the far plane.
  private quadCamera = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
  private quad: Mesh;
  private screenMaterial: ShaderMaterial;

  private emptyTexture = createEmptyTexture();

  glowEnabled: boolean;

  constructor(renderer: WebGLRenderer, tier: GFXTier) {
    this.renderer = renderer;
    this.glowEnabled = tier.glowEnabled;

    const { width, height } = renderer.domElement;

    this.sceneRT = new WebGLRenderTarget(width, height, {
      // A tier value of 1 means "no MSAA". Passing samples: 1 would ask for a
      // single-sample multisample target, which is not a valid configuration.
      samples: msaaSamples(tier.maxSamples),
      colorSpace: SRGBColorSpace,
    });

    // The glow pass is never anti-aliased: it is about to be blurred.
    this.glowRT = new WebGLRenderTarget(width, height, {
      samples: 0,
      colorSpace: SRGBColorSpace,
    });

    this.compRT = new WebGLRenderTarget(width, height, {
      samples: 0,
      colorSpace: SRGBColorSpace,
    });

    this.sunRT = new WebGLRenderTarget(width, height, {
      samples: 0,
      colorSpace: SRGBColorSpace,
    });

    this.glowBlur = new BlurPass(this.glowRT.texture, width, height, {
      scale: tier.blurScale,
      radius: 1,
      quality: tier.blurQuality as BlurQuality,
      iterations: tier.blurIterations,
    });
    this.glowBlur.target.texture.colorSpace = renderer.outputColorSpace;

    // The fire pass keeps its own blur: the legacy used fixed settings here
    // rather than the tier's, so the sun's plasma looks the same everywhere.
    this.sunBlur = new BlurPass(this.sunRT.texture, width, height, {
      scale: 0.5,
      radius: 1,
      quality: 2,
      iterations: 4,
    });
    this.sunBlur.target.texture.colorSpace = renderer.outputColorSpace;

    this.compMaterial = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        scene: { value: null },
        glow: { value: null },
        glowBlurred: { value: null },
        fire: { value: null },
        camPos: { value: null },
      },
    });

    // Screen blit. A plain textured quad, kept as a ShaderMaterial so the
    // composited result is written through without further colour management.
    this.screenMaterial = new ShaderMaterial({
      vertexShader,
      fragmentShader: `
        in vec2 vUv;
        uniform sampler2D scene;
        void main() { gl_FragColor = texture2D(scene, vUv); }
      `,
      uniforms: { scene: { value: null } },
    });

    this.quad = new Mesh(new PlaneGeometry(1, 1), this.compMaterial);
    this.quadScene.add(this.quad);
    this.quadCamera.position.z = 1;
  }

  setSize(width: number, height: number): void {
    this.sceneRT.setSize(width, height);
    this.glowRT.setSize(width, height);
    this.compRT.setSize(width, height);
    this.sunRT.setSize(width, height);
    this.glowBlur.setSize(width, height);
    this.sunBlur.setSize(width, height);
  }

  setTier(tier: GFXTier): void {
    this.glowEnabled = tier.glowEnabled;
    this.sceneRT.samples = msaaSamples(tier.maxSamples);
    this.glowBlur.applySettings({
      scale: tier.blurScale,
      quality: tier.blurQuality as BlurQuality,
      iterations: tier.blurIterations,
    });
  }

  /**
   * Restores normal rendering: every mesh visible as it was, glow off.
   *
   * The glow pass hides meshes that cannot contribute to it, so the previous
   * visibility has to be stashed and put back.
   */
  private prepareForSceneRender(scene: Scene): void {
    scene.traverse((object) => {
      const mesh = object as Mesh;
      if (!(mesh as unknown as { isMesh?: boolean }).isMesh) return;

      if (!mesh.visible && mesh.userData.wasVisible) mesh.visible = true;
      mesh.userData.wasVisible = mesh.visible;

      if (mesh.visible) {
        setGlowUniform(mesh.material as GlowCapableMaterial, false);
      }
    });
  }

  /** Switches every glow-capable mesh into glow mode and hides the rest. */
  private prepareForGlowRender(scene: Scene): void {
    scene.traverse((object) => {
      const mesh = object as Mesh;
      if (!(mesh as unknown as { isMesh?: boolean }).isMesh) return;
      if (!mesh.visible) return;

      // Note Line2 (the orbital paths) reports isMesh, and its LineMaterial
      // has no isGlow uniform -- so paths are hidden during the glow pass,
      // matching the legacy behaviour.
      if (!setGlowUniform(mesh.material as GlowCapableMaterial, true)) {
        mesh.visible = false;
      }
    });
  }

  private drawQuad(
    target: WebGLRenderTarget | null,
    material: ShaderMaterial
  ): void {
    this.quad.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.quadScene, this.quadCamera);
  }

  render(
    scene: Scene,
    camera: Camera,
    target: WebGLRenderTarget | null = null
  ) {
    // 1. The scene as normally lit.
    this.prepareForSceneRender(scene);
    this.renderer.setRenderTarget(this.sceneRT);
    this.renderer.render(scene, camera);

    // 2 & 3. The glow contribution, then blurred.
    if (this.glowEnabled) {
      this.prepareForGlowRender(scene);

      // The background must not bleed into the glow.
      const background = scene.background;
      scene.background = null;

      this.renderer.setRenderTarget(this.glowRT);
      this.renderer.render(scene, camera);
      scene.background = background;

      this.glowBlur.render(this.renderer);

      // Put the scene back before anything else reads it.
      this.prepareForSceneRender(scene);
    }

    // 4. The sun's fire pass: its halo and magnetic field, blurred into
    // plasma. See renderFirePass for why this uses layers.
    const fire = this.renderFirePass(scene, camera);

    // 5. Composite.
    const uniforms = this.compMaterial.uniforms;
    uniforms.scene.value = this.sceneRT.texture;
    uniforms.glow.value = this.glowEnabled
      ? this.glowRT.texture
      : this.emptyTexture;
    uniforms.glowBlurred.value = this.glowEnabled
      ? this.glowBlur.texture
      : this.emptyTexture;
    uniforms.fire.value = fire;
    uniforms.camPos.value = camera.position;

    this.drawQuad(this.compRT, this.compMaterial);

    // 6. Blit to the screen, or to a caller-supplied target.
    this.screenMaterial.uniforms.scene.value = this.compRT.texture;
    this.drawQuad(target, this.screenMaterial);
    this.renderer.setRenderTarget(null);
  }

  /**
   * Renders the sun's halo and magnetic field, then blurs them.
   *
   * The legacy moved the sun into a second scene for this and put it back
   * afterwards. Reparenting objects React owns would fight the reconciler, so
   * this switches the camera onto FIRE_LAYER instead: the halo and field lines
   * live only on that layer, and nothing else in the scene is on it.
   *
   * The sun's own body is on both layers, and swaps to an opaque black
   * material here so its disc occludes the halo behind it rather than letting
   * it bleed through.
   */
  private renderFirePass(scene: Scene, camera: Camera): Texture {
    const swapped: Array<Mesh> = [];

    scene.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.userData?.isSun || !mesh.userData.blockMaterial) return;
      mesh.userData.defaultMaterial = mesh.material;
      mesh.material = mesh.userData.blockMaterial;
      swapped.push(mesh);
    });

    const cameraLayers = camera.layers.mask;
    camera.layers.set(FIRE_LAYER);

    const background = scene.background;
    scene.background = null;

    this.renderer.setRenderTarget(this.sunRT);
    this.renderer.render(scene, camera);

    scene.background = background;
    camera.layers.mask = cameraLayers;

    for (const mesh of swapped) {
      mesh.material = mesh.userData.defaultMaterial;
    }

    this.sunBlur.render(this.renderer);

    return this.sunBlur.texture;
  }

  get texture(): Texture {
    return this.compRT.texture;
  }

  dispose(): void {
    this.sceneRT.dispose();
    this.glowRT.dispose();
    this.compRT.dispose();
    this.sunRT.dispose();
    this.glowBlur.dispose();
    this.sunBlur.dispose();
    this.compMaterial.dispose();
    this.screenMaterial.dispose();
    this.quad.geometry.dispose();
    this.emptyTexture.dispose();
    this.quadScene.clear();
  }
}
