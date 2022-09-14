import { Color, Material, MeshPhongMaterial, Shader, ShaderMaterial } from 'three';

import s_output_frag from '../../../glsl/lib/standard_output.frag';
import s_pars_frag from '../../../glsl/lib/standard_pars.frag';

import sp_normal from '../../../glsl/utils/spherical_normals.frag';
import standard_vert from '../../../glsl/vfx/standard.vert';

export const initMaterial = (mat:Material): Material => {
    if(mat['emissive'] != undefined) {
        if(!mat.defines) mat.defines = {};
        mat.defines['EMISSIVE'] = '';
        
    }
    mat.onBeforeCompile = (shader:Shader) => {
        let fs = shader.fragmentShader;

        fs = fs.replace("#include <clipping_planes_pars_fragment>", s_pars_frag);
        fs = fs.replace("#include <output_fragment>", s_output_frag);

        shader.fragmentShader = fs;
    }

    return mat;
}

export const COMP_SP_NORMAL = new ShaderMaterial({
    vertexShader: standard_vert,
    fragmentShader: sp_normal
});