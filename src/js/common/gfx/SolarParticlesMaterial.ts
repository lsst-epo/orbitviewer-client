import { MeshPhongMaterial, MeshPhongMaterialParameters, Shader, WebGLRenderer } from "three";

import s_output_frag from '../../../glsl/lib/standard_output.frag';
import s_pars_frag from '../../../glsl/lib/standard_pars.frag';
import pars_vert from '../../../glsl/sim/pars.vert';
import computed_matrix from '../../../glsl/sim/matrix.vert';

export class SolarParticlesMaterial extends MeshPhongMaterial {
    shaderRef:Shader;

    constructor(opts:MeshPhongMaterialParameters) {
        super(opts);

        if(!this.defines) this.defines = {};
        this.defines['EMISSIVE'] = '';
    }

    onBeforeCompile(shader: Shader, renderer: WebGLRenderer): void {
        let fs = shader.fragmentShader;
        let vs = shader.vertexShader;

        this.shaderRef = shader;
        vs = vs.replace("#include <clipping_planes_pars_vertex>", pars_vert);
        vs = vs.replace("#include <project_vertex>", computed_matrix);

        fs = fs.replace("#include <clipping_planes_pars_fragment>", s_pars_frag);
        fs = fs.replace("#include <output_fragment>", s_output_frag);

        shader.uniforms.computedPosition = {value: null};

        shader.vertexShader = vs;
        shader.fragmentShader = fs;
    }
}