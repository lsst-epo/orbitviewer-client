import { LineBasicMaterial, LineBasicMaterialParameters, Shader, WebGLRenderer } from "three";

import output_frag from '../../../glsl/lib/trajectories/output.frag';
import pars_frag from '../../../glsl/lib/trajectories/pars.frag';
import pars_vert from '../../../glsl/lib/trajectories/pars.vert';
import weight from '../../../glsl/lib/trajectories/weight.vert';
import poscalc from '../../../glsl/lib/trajectories/poscalc.vert';
import { OrbitElements } from "../solar/SolarSystem";
import { SolarTimeManager } from "../solar/SolarTime";

export class TrajectoryMaterial extends LineBasicMaterial {
    shader:Shader = null;
    el:OrbitElements

    constructor(opts:LineBasicMaterialParameters, el:OrbitElements) {
        super(opts);
        this.el = el;
    }

    onBeforeCompile(shader: Shader, renderer: WebGLRenderer): void {
        let vs = shader.vertexShader;
        let fs = shader.fragmentShader;

        vs = vs.replace("#include <clipping_planes_pars_vertex>", pars_vert);
        vs = vs.replace("#include <project_vertex>", poscalc);
        vs = vs.replace("#include <fog_vertex>", weight);

        fs = fs.replace("#include <clipping_planes_pars_fragment>", pars_frag);
        fs = fs.replace("#include <output_fragment>", output_frag);

        shader.uniforms.time = {value: 0};
        shader.uniforms.el = {value: this.el}
        shader.uniforms.d = {value: SolarTimeManager.getMJDonDate(new Date())}
        shader.vertexShader = vs;
        shader.fragmentShader = fs;

        this.shader = shader;
    }
}