import type { LineMaterial } from "three-stdlib";
import type { IUniform } from "three";

/**
 * Fades an orbit path out as it approaches the camera.
 *
 * In object view the camera sits on the orbit -- it is following a body that
 * is itself on the line -- so the path passes within a couple of body radii
 * of the eye. That is genuine perspective, but it does not read as one: the
 * two halves sweep off at wildly different screen angles and the orbit looks
 * like it turns a corner at the planet.
 *
 * Fading out the nearest stretch removes exactly the part whose projection is
 * pathological and leaves the rest, which reads as depth rather than as a
 * kink. The legacy started on this -- `PathMaterial` carries `planetPosition`
 * and `fadeDistance` uniforms, and `path/frag.glsl` has the smoothstep for it
 * commented out -- but never finished it.
 *
 * Keyed on distance from the camera rather than from the planet, as the
 * legacy intended. It is the camera that makes the projection degenerate, so
 * the fade costs nothing in orbit view, where the whole path is far away.
 */

/**
 * Splice points, all four unique and outside any `#ifdef`.
 *
 * `#include <common>` carries the declarations, because LineMaterial's own
 * globals sit inside feature guards. In particular `worldPos` -- the obvious
 * candidate for a view-space position -- exists only under `WORLD_UNITS`,
 * which is off unless the line is measured in world units, so this carries
 * its own varying rather than borrowing one that may not be there.
 */
const DECLARATIONS = "#include <common>";
/** Unconditional, and already the view-space position of this vertex's end. */
const VERTEX_ANCHOR = "vec4 mvPosition = ( position.y < 0.5 ) ? start : end;";
/** LineMaterial's own alpha is final by this point. */
const FRAGMENT_ANCHOR = "vec4 diffuseColor = vec4( diffuse, alpha );";

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
        ${FRAGMENT_ANCHOR}`
      );
  };

  material.needsUpdate = true;

  return uniforms;
}

/**
 * A fade band for a body of the given scene radius.
 *
 * Proportional to the body, because that is what sets how close the camera
 * gets: object view frames every body at the same few multiples of its own
 * radius, so a fixed distance would be far too aggressive for a planet and
 * do nothing at all for an asteroid.
 */
export const fadeBandFor = (radius: number) => ({
  near: radius * 2,
  far: radius * 14,
});
