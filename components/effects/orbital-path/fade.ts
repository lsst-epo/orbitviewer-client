import type { LineMaterial } from "three-stdlib";
import type { IUniform } from "three";

/**
 * Splice points, all unique and outside any `#ifdef`. `worldPos` is NOT usable
 * here and a bad splice renders nothing silently -- see README.
 */
const DECLARATIONS = "#include <common>";
/** Unconditional, and already the view-space position of this vertex's end. */
const VERTEX_ANCHOR = "vec4 mvPosition = ( position.y < 0.5 ) ? start : end;";
/** LineMaterial's own alpha is final by this point. */
const FRAGMENT_ANCHOR = "vec4 diffuseColor = vec4( diffuse, alpha );";

/**
 * Ported from the one live line of `glsl/lib/path/frag.glsl`. Inlined rather
 * than taken from the shared chunk, and load-bearing -- see README.
 */
const DESATURATE = `
  float pathLum = dot( vec3( 0.299, 0.587, 0.114 ), diffuseColor.rgb );
  diffuseColor.rgb = mix(
    diffuseColor.rgb,
    vec3( pathLum ),
    max( 1.0 - opacity, 0.2 )
  );`;

export interface PathFadeUniforms {
  fadeNear: IUniform<number>;
  fadeFar: IUniform<number>;
}

/**
 * Patches a LineMaterial in place and returns its fade uniforms, so the band
 * can be moved later without recompiling.
 */
export function applyPathFade(material: LineMaterial): PathFadeUniforms {
  const uniforms: PathFadeUniforms = {
    fadeNear: { value: 0 },
    fadeFar: { value: 0 },
  };

  material.onBeforeCompile = (shader) => {
    shader.uniforms.fadeNear = uniforms.fadeNear;
    shader.uniforms.fadeFar = uniforms.fadeFar;

    shader.vertexShader = shader.vertexShader
      .replace(DECLARATIONS, `${DECLARATIONS}\nvarying float vCameraDist;`)
      .replace(
        VERTEX_ANCHOR,
        `${VERTEX_ANCHOR}\nvCameraDist = length( mvPosition.xyz );`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        DECLARATIONS,
        `${DECLARATIONS}
        varying float vCameraDist;
        uniform float fadeNear;
        uniform float fadeFar;`
      )
      .replace(
        FRAGMENT_ANCHOR,
        `alpha *= smoothstep( fadeNear, fadeFar, vCameraDist );
        ${FRAGMENT_ANCHOR}
        ${DESATURATE}`
      );
  };

  material.needsUpdate = true;

  return uniforms;
}

/** Fade band for a body of the given scene radius, proportional to it. */
export const fadeBandFor = (radius: number) => ({
  near: radius * 2,
  far: radius * 14,
});
