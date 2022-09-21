/**
 * WebGL 2 MRT composer
 */

import { BlurPass, FboUtils } from "@jocabola/gfx";
import { OrthographicCamera, PerspectiveCamera, RGBAFormat, Scene, ShaderMaterial, UnsignedByteType, WebGLMultipleRenderTargets, WebGLRenderer } from "three";

import f_comp from '../../../glsl/vfx/comp.frag';
import v_standard from '../../../glsl/vfx/standard.vert';

const COMP = new ShaderMaterial({
    vertexShader: v_standard,
    fragmentShader: f_comp,
    uniforms: {
        tScene: {value: null},
        tGlow: {value: null}
    }
});

export class VFXRenderer {
    rnd:WebGLRenderer;
    sceneRT:WebGLMultipleRenderTargets;
    glow:BlurPass;

    constructor(renderer:WebGLRenderer, width:number, height:number) {
        this.rnd = renderer;

        const w = width * window.devicePixelRatio;
        const h = height * window.devicePixelRatio;

        this.sceneRT = new WebGLMultipleRenderTargets(w, h, 2, {
            format: RGBAFormat,
            type: UnsignedByteType
        });

        this.sceneRT.samples = 4;
        this.sceneRT.texture[ 0 ].name = 'diffuse';
        this.sceneRT.texture[ 1 ].name = 'glow';

        this.glow = new BlurPass(this.sceneRT.texture[1],w, h, {
            scale: .3,
            radius: 1,
            iterations: 8,
            quality: 0
        });
    }

    resize(width:number, height:number) {
        const w = width * window.devicePixelRatio;
        const h = height * window.devicePixelRatio;

        this.sceneRT.setSize(w, h);
        this.glow.setSize(w, h);
    }

    render(scene:Scene, camera:PerspectiveCamera|OrthographicCamera) {
        this.rnd.setRenderTarget(this.sceneRT);
        this.rnd.render(scene, camera);

        // glow
        this.glow.renderInternal(this.rnd);
        this.rnd.setRenderTarget(null);

        // final comp
        COMP.uniforms.tScene.value = this.sceneRT.texture[0];
        COMP.uniforms.tGlow.value = this.glow.texture;

        FboUtils.renderToViewport(this.rnd, COMP);

        this.rnd.setRenderTarget(null);
    }
}