import { Color, ColorRepresentation, Material, MeshPhongMaterial, Shader, ShaderMaterial, Texture } from 'three';

import p_fresnel_frag from '../../../glsl/lib/fresnel.frag';
import p_output_frag from '../../../glsl/lib/planet_output.frag';
import p_pars_frag from '../../../glsl/lib/planet_pars.frag';
import s_output_frag from '../../../glsl/lib/standard_output.frag';
import s_pars_frag from '../../../glsl/lib/standard_pars.frag';

import sp_normal from '../../../glsl/utils/spherical_normals.frag';
import standard_vert from '../../../glsl/vfx/standard.vert';

const P_MAT = new MeshPhongMaterial({
    shininess: 0
});

export const getPlanetMaterialInstance = (map:Texture=null, fresnelColor:ColorRepresentation=0xffffff): MeshPhongMaterial => {
    const mat = P_MAT.clone();
    mat.map = map;

    mat.onBeforeCompile = (shader: Shader) => {
        let vs = shader.vertexShader;
        let fs = shader.fragmentShader;

        vs = vs.replace("#include <clipping_planes_pars_vertex>", `#include <clipping_planes_pars_vertex>
#include <fresnel_pars_vert>`);
        vs = vs.replace("#include <fog_vertex>", `#include <fog_vertex>
#include <fresnel_vert>`);
        
        fs = fs.replace("#include <clipping_planes_pars_fragment>", p_pars_frag);
        fs = fs.replace("#include <envmap_fragment>", p_fresnel_frag);
        fs = fs.replace("#include <output_fragment>", p_output_frag);

        shader.uniforms['fresnelColor'] = {
            value: new Color(fresnelColor)
        }

        shader.uniforms['fresnelWidth'] = {
            value: 0.02
        }

        shader.vertexShader = vs;
        shader.fragmentShader = fs;
    }

    return mat;
}

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

export const initSunMaterial = (sunMat:MeshPhongMaterial): MeshPhongMaterial => {

    sunMat.onBeforeCompile = (shader:Shader) => {
        let vs = shader.vertexShader;
        let fs = shader.fragmentShader;

        vs = vs.replace('#include <clipping_planes_pars_vertex>', '#include <sun_pars_vert>');
        vs = vs.replace('#include <fog_vertex>', '#include <sun_pos_out>');

        fs = fs.replace('#include <clipping_planes_pars_fragment>', '#include <sun_pars_frag>');
        fs = fs.replace('#include <output_fragment>', '#include <sun_output>');

        shader.vertexShader = vs;
        shader.fragmentShader = fs;
        shader.uniforms['time'] = {
            value: 0
        }
        shader.uniforms['fresnelColor'] = {
            value: new Color(0xffffff)
        }

        shader.uniforms['fresnelWidth'] = {
            value: 0.04
        }

        sunMat['uniforms'] = shader.uniforms;
    }

    return sunMat;
}