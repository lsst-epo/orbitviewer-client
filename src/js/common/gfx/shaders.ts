import { ShaderChunk } from 'three';

import fbm3D from '../../../glsl/includes/fbm3D.glsl';
import fbm4D from '../../../glsl/includes/fbm4D.glsl';
import fresnel_frag from '../../../glsl/includes/fresnel/frag.glsl';
import fresnel_pars_frag from '../../../glsl/includes/fresnel/pars_frag.glsl';
import fresnel_pars_vert from '../../../glsl/includes/fresnel/pars_vert.glsl';
import fresnel_vert from '../../../glsl/includes/fresnel/vert.glsl';
import noise3D from '../../../glsl/includes/noise3D.glsl';
import noise4D from '../../../glsl/includes/noise4D.glsl';
import solar_compute from '../../../glsl/includes/solar/compute.glsl';
import sun_output from '../../../glsl/includes/sun/output.glsl';
import sun_pars_frag from '../../../glsl/includes/sun/pars_frag.glsl';
import sun_pars_vert from '../../../glsl/includes/sun/pars_vert.glsl';
import sun_pos_out from '../../../glsl/includes/sun/pos_out.glsl';

export function initShaders() {
    ShaderChunk['fbm3D'] = fbm3D
    ShaderChunk['fbm4D'] = fbm4D
    ShaderChunk['fresnel_frag'] = fresnel_frag
    ShaderChunk['fresnel_pars_frag'] = fresnel_pars_frag
    ShaderChunk['fresnel_pars_vert'] = fresnel_pars_vert
    ShaderChunk['fresnel_vert'] = fresnel_vert
    ShaderChunk['noise3D'] = noise3D
    ShaderChunk['noise4D'] = noise4D
    ShaderChunk['solar_compute'] = solar_compute
    ShaderChunk['sun_output'] = sun_output
    ShaderChunk['sun_pars_frag'] = sun_pars_frag
    ShaderChunk['sun_pars_vert'] = sun_pars_vert
    ShaderChunk['sun_pos_out'] = sun_pos_out
}