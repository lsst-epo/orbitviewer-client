import curl3D from "./includes/curl3D.glsl";
import curl4D from "./includes/curl4D.glsl";
import desaturate from "./includes/desaturate.glsl";
import fbm3D from "./includes/fbm3D.glsl";
import fbm4D from "./includes/fbm4D.glsl";
import fresnel_pars_frag from "./includes/fresnel/pars_frag.glsl";
import fresnel_pars_vert from "./includes/fresnel/pars_vert.glsl";
import fresnel_vert from "./includes/fresnel/vert.glsl";
import glow_frag_init from "./includes/glow_frag_init.glsl";
import glow_pars_frag from "./includes/glow_pars_frag.glsl";
import noise3D from "./includes/noise3D.glsl";
import noise4D from "./includes/noise4D.glsl";
import polar from "./includes/polar.glsl";
import solar_compute from "./includes/solar_compute.glsl";

const chunks: Record<string, string> = {
  curl3D,
  curl4D,
  desaturate,
  fbm3D,
  fbm4D,
  fresnel_pars_frag,
  fresnel_pars_vert,
  fresnel_vert,
  glow_frag_init,
  glow_pars_frag,
  noise3D,
  noise4D,
  polar,
  solar_compute,
};
/** Resolve active custom includes; leave comments and Three built-ins intact. */
export function composeShader(source: string): string {
  return source.replace(
    /^[ \t]*#include <([\w]+)>[ \t]*$/gm,
    (match, name: string) =>
      chunks[name] ? composeShader(chunks[name]) : match,
  );
}
