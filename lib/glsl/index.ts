/* eslint-disable camelcase -- chunk identifiers must match the names used in
   `#include <name>` directives inside the .glsl sources, which are snake_case
   by GLSL convention. Renaming them here would break the shader includes. */
import { ShaderChunk } from "three";

// Shared GLSL chunks. These are the reusable functions that the body, sun,
// effect and simulation shaders #include -- noise, curl, fbm, fresnel, glow.
import curl3D from "./includes/curl3D.glsl";
import curl4D from "./includes/curl4D.glsl";
import desaturate from "./includes/desaturate.glsl";
import fbm3D from "./includes/fbm3D.glsl";
import fbm4D from "./includes/fbm4D.glsl";
import glow_frag_init from "./includes/glow_frag_init.glsl";
import glow_pars_frag from "./includes/glow_pars_frag.glsl";
import noise3D from "./includes/noise3D.glsl";
import noise4D from "./includes/noise4D.glsl";
import polar from "./includes/polar.glsl";
import solar_compute from "./includes/solar_compute.glsl";
import fresnel_pars_frag from "./includes/fresnel/pars_frag.glsl";
import fresnel_pars_vert from "./includes/fresnel/pars_vert.glsl";
import fresnel_vert from "./includes/fresnel/vert.glsl";

/**
 * Registers the shared chunks on three's global ShaderChunk registry so any
 * material can `#include <noise3D>` rather than duplicating the source.
 *
 * This replaces the legacy `scripts/build/glsl.js`, which walked the includes
 * directory at build time and generated a `src/js/gfx/Shaders.ts` barrel of
 * string imports. Turbopack's raw-loader rule (see next.config.js) makes that
 * codegen step unnecessary -- the .glsl files import directly as strings.
 *
 * Safe to call repeatedly; registration is idempotent.
 */
export function registerShaderChunks(): void {
  Object.assign(ShaderChunk, {
    curl3D,
    curl4D,
    desaturate,
    fbm3D,
    fbm4D,
    glow_frag_init,
    glow_pars_frag,
    noise3D,
    noise4D,
    polar,
    solar_compute,
    fresnel_pars_frag,
    fresnel_pars_vert,
    fresnel_vert,
  });
}
