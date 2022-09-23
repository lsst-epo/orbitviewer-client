import { MathUtils } from "@jocabola/math";
import { Color } from "three";
import { ColorRepresentation, MeshPhongMaterial, MeshPhongMaterialParameters, Shader, WebGLRenderer } from "three";

import p_fresnel_frag from '../../../glsl/lib/fresnel.frag';
import p_output_frag from '../../../glsl/lib/planet_output.frag';
import p_pars_frag from '../../../glsl/lib/planet_pars.frag';

export type PlanetMaterialParameters = {
    fresnelColor?:ColorRepresentation;
    fresnelWidth?:number;
    sunIntensity?:number;
    selected?:boolean;
}

export class PlanetMaterial extends MeshPhongMaterial {
    shaderRef:Shader = null;
    fresnel:Color;
    fresnelWidth:number;
    sunIntensity:number;
    selected:boolean;

    constructor(opts:MeshPhongMaterialParameters=null, opts2:PlanetMaterialParameters={}) {
        super(opts);
        this.fresnel = new Color(opts2.fresnelColor || 0xffffff);
        this.fresnelWidth = opts2.fresnelWidth || .02;
        this.sunIntensity = opts2.sunIntensity || 1;
        this.selected = opts2.selected != undefined ? opts2.selected : false;

        if(!this.defines) {
            this.defines = {};
        }

        this.defines['FRESNEL_SELECTED'] = '';
    }

    onBeforeCompile(shader: Shader, renderer: WebGLRenderer): void {
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
            value: new Color(this.fresnel)
        }

        shader.uniforms['sunIntensity'] = {
            value: this.sunIntensity
        }

        shader.uniforms['fresnelWidth'] = {
            value: this.fresnelWidth
        }

        shader.uniforms['selected'] = {
            value: this.selected ? 1 : 0
        }

        shader.vertexShader = vs;
        shader.fragmentShader = fs;
        this.shaderRef = shader;
    }

    update() {
        if(!this.shaderRef) return;
        const u = this.shaderRef.uniforms;
        u.fresnelWidth.value = this.fresnelWidth;
        u.sunIntensity.value = this.sunIntensity;
        u.fresnelColor.value.copy(this.fresnel);
        u.selected.value = MathUtils.lerp(u.selected.value, this.selected ? 1 : 0, .06);
    }
}