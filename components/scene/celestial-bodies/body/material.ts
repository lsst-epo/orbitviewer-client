import {
  MeshStandardMaterial,
  Texture,
  WebGLProgramParametersWithUniforms,
} from "three";
import parsVertex from "./body_pars.vert";
import vertex from "./body.vert";
import fragment from "./body.frag";

export interface BodyMaterialOptions {
  /** Enables the EARTH define: night lights and an animated cloud layer. */
  isEarth?: boolean;
  nightMap?: Texture | null;
  cloudsMap?: Texture | null;
}

export class BodyMaterial extends MeshStandardMaterial {
  shaderRef: WebGLProgramParametersWithUniforms | null = null;

  private isEarth: boolean;
  nightMap: Texture | null;
  cloudsMap: Texture | null;

  readonly isBodyMaterial = true;

  /**
   * Re-types the inherited property without emitting an initializer: a real
   * field would run after super() and wipe the STANDARD define.
   */
  declare defines: Record<string, string>;

  constructor(
    parameters: ConstructorParameters<typeof MeshStandardMaterial>[0] = {},
    {
      isEarth = false,
      nightMap = null,
      cloudsMap = null,
    }: BodyMaterialOptions = {}
  ) {
    super(parameters);

    this.isEarth = isEarth;
    this.nightMap = nightMap;
    this.cloudsMap = cloudsMap;

    if (!this.defines) this.defines = {};
    if (isEarth) this.defines.EARTH = "";
  }

  onBeforeCompile(parameters: WebGLProgramParametersWithUniforms): void {
    parameters.vertexShader = parameters.vertexShader
      .replace("#include <clipping_planes_pars_vertex>", parsVertex)
      .replace("#include <fog_vertex>", vertex);

    parameters.fragmentShader = fragment;

    parameters.uniforms.isGlow = { value: false };
    parameters.uniforms.hasGlow = { value: this.isEarth };

    if (this.isEarth) {
      parameters.uniforms.nightMap = { value: this.nightMap };
      parameters.uniforms.cloudsMap = { value: this.cloudsMap };
      parameters.uniforms.time = { value: 0 };
    }

    this.shaderRef = parameters;
  }

  /** Advances the animated cloud layer. No-op for bodies without EARTH. */
  updateTime(time: number): void {
    if (!this.isEarth || !this.shaderRef?.uniforms.time) return;
    this.shaderRef.uniforms.time.value = time;
  }

  /** Toggles the bloom-extraction pass. */
  setGlowPass(isGlow: boolean): void {
    if (!this.shaderRef?.uniforms.isGlow) return;
    this.shaderRef.uniforms.isGlow.value = isGlow;
  }
}
