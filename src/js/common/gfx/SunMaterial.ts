import { MathUtils } from "@jocabola/math";
import { Color, MeshPhongMaterial, MeshPhongMaterialParameters, Shader, Vector3, WebGLRenderer } from "three";
import { CameraManager } from "../core/CameraManager";
import { Sun, SUN_SCALE } from "../solar/Sun";

const tmp = new Vector3();

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
            value: 0.25
        }

        shader.uniforms['glowStrength'] = {
            value: 2
        }

        shader.uniforms['vertexAmp'] = {
            value: 0.0005
        }

        this.shaderRef = shader;
        // sunMat['uniforms'] = shader.uniforms;
    }

    update(time:number, sunRef:Sun) {
        if(!this.shaderRef) return;
        const u = this.shaderRef.uniforms;
        u.time.value = time;
        let d = 0;
        if(CameraManager.active) {
            d = tmp.copy(CameraManager.cam.position).length();
            // console.log(d);
        }

        const p = MathUtils.smoothstep(SUN_SCALE.min, SUN_SCALE.max, sunRef.scale.x);
        const min = MathUtils.lerp(.0025, .02, p);
        const max = MathUtils.lerp(.1, .1, p);

        /* u.fresnelWidth.value = MathUtils.mix(
            min,
            max,
            MathUtils.smoothstep(0.08, 5, d)
        ) */
    }
}