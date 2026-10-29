import {
  Camera,
  DataTexture,
  Material,
  Mesh,
  MeshBasicMaterial,
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
import {
  BlurPass,
  type BlurQuality,
} from "@/components/scene/effects/blur/blurPass";
import { FIRE_LAYER } from "./layers";
import type { GFXTier } from "@/lib/solar/quality";
import vertexShader from "./comp.vert";
import fragmentShader from "./comp.frag";

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
  shaderRef?: WebGLProgramParametersWithUniforms | null;
}

/**
 * Sets a mesh's glow uniform, reporting whether it could. Discriminated on
 * `shaderRef`, not a marker property -- see README.
 */
function setGlowUniform(
  material: GlowCapableMaterial,
  value: boolean
): boolean {
  const uniforms = material.shaderRef?.uniforms ?? material.uniforms;

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
  private screenMaterial: MeshBasicMaterial;

  private emptyTexture = createEmptyTexture();

  glowEnabled: boolean;

  constructor(renderer: WebGLRenderer, tier: GFXTier) {
    this.renderer = renderer;
    this.glowEnabled = tier.glowEnabled;

    const { width, height } = renderer.domElement;

    this.sceneRT = new WebGLRenderTarget(width, height, {
      samples: msaaSamples(tier.maxSamples),
      colorSpace: SRGBColorSpace,
    });

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

    /**
     * Screen blit. MUST be a built-in material: a raw ShaderMaterial skips
     * three's output colour-space encode, and the whole scene then reaches the
     * canvas in linear colour at half brightness. See README.
     */
    // MUST be a built-in material: a raw ShaderMaterial skips three's output
    // colour-space encode and the scene reaches the canvas at half brightness.
    // See README.
    this.screenMaterial = new MeshBasicMaterial({ toneMapped: false });

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

  /** Restores normal rendering: every mesh visible as it was, glow off. */
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

      if (!setGlowUniform(mesh.material as GlowCapableMaterial, true)) {
        mesh.visible = false;
      }
    });
  }

  private drawQuad(target: WebGLRenderTarget | null, material: Material): void {
    this.quad.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.quadScene, this.quadCamera);
  }

  render(
    scene: Scene,
    camera: Camera,
    target: WebGLRenderTarget | null = null
  ) {
    this.prepareForSceneRender(scene);
    this.renderer.setRenderTarget(this.sceneRT);
    this.renderer.render(scene, camera);

    if (this.glowEnabled) {
      this.prepareForGlowRender(scene);

      const background = scene.background;
      scene.background = null;

      this.renderer.setRenderTarget(this.glowRT);
      this.renderer.render(scene, camera);
      scene.background = background;

      this.glowBlur.render(this.renderer);

      this.prepareForSceneRender(scene);
    }

    const fire = this.renderFirePass(scene, camera);

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

    this.screenMaterial.map = this.compRT.texture;
    this.drawQuad(target, this.screenMaterial);
    this.renderer.setRenderTarget(null);
  }

  /** Renders the sun's halo and magnetic field, then blurs them. */
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
