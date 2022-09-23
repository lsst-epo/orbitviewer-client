import { Color, MeshPhongMaterial, MeshPhongMaterialParameters, Shader, WebGLRenderer } from "three";

export class SunMaterial extends MeshPhongMaterial {
    shaderRef:Shader;

    constructor(params:MeshPhongMaterialParameters) {
        super(params);
    }

    onBeforeCompile(shader: Shader, renderer: WebGLRenderer): void {
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
            value: 0.05
        }

        this.shaderRef = shader;
        // sunMat['uniforms'] = shader.uniforms;
    }

    update(time:number) {
        if(!this.shaderRef) return;
        const u = this.shaderRef.uniforms;
        u.time.value = time;
    }
}