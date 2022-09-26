/**
 * WebGL 2 MRT composer
 */

import { BlurPass, FboUtils } from "@jocabola/gfx";
import { PerspectiveCamera, RGBAFormat, Scene, ShaderMaterial, Texture, UnsignedByteType, WebGLMultipleRenderTargets, WebGLRenderer, WebGLRenderTarget } from "three";

import f_comp from '../../../glsl/vfx/comp.frag';
import v_standard from '../../../glsl/vfx/standard.vert';
import { Skybox } from "./Skybox";

const COMP = new ShaderMaterial({
    vertexShader: v_standard,
    fragmentShader: f_comp,
    uniforms: {
        tBackground: {value: null},
        tScene: {value: null},
        tGlow: {value: null},
        glowStrength: {value: 1.8}
    },
    transparent: true
});

export class VFXRenderer {
    rnd:WebGLRenderer;
    bgRT:WebGLRenderTarget;
    sceneRT:WebGLMultipleRenderTargets;
    glow:BlurPass;
    bg:Texture = null;
    bgScene:Scene = new Scene();
    bgCamera:PerspectiveCamera = new PerspectiveCamera(45, 1);
    skybox:Skybox;
    needsBGUpdate:boolean = false;

    constructor(renderer:WebGLRenderer, width:number, height:number) {
        this.rnd = renderer;

        const w = width * window.devicePixelRatio;
        const h = height * window.devicePixelRatio;

        // this.cubeMap = new EquirectangularToCubemap(renderer, 2048);
        this.skybox = new Skybox();
        this.bgRT = new WebGLRenderTarget(w, h);

        this.bgScene.add(this.bgCamera);

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

        this.bgRT.setSize(w, h);
        this.sceneRT.setSize(w, h);
        this.glow.setSize(w, h);
    }

    render(scene:Scene, camera:PerspectiveCamera) {
        this.rnd.autoClear = true;
        this.rnd.setClearColor(0x000000, 1);

        if(this.bg && this.needsBGUpdate) {
            this.needsBGUpdate = false;
            /* this.cubeMap.convert(this.bg);
            this.bgScene.background = this.cubeMap.texture; */
            this.skybox.skyMat.map = this.bg;
        }
        this.rnd.setRenderTarget(this.bgRT);
        this.skybox.render(this.rnd, camera);

        this.rnd.setRenderTarget(this.sceneRT);
        this.rnd.render(scene, camera);

        // glow
        this.rnd.setClearColor(0x000000, 1);
        this.glow.renderInternal(this.rnd);
        this.rnd.setRenderTarget(null);

        // final comp
        COMP.uniforms.tBackground.value = this.bgRT.texture;
        COMP.uniforms.tScene.value = this.sceneRT.texture[0];
        COMP.uniforms.tGlow.value = this.glow.texture;

        /* FboUtils.drawTexture(this.bgRT.texture, this.rnd, 0, 0, window.innerWidth, window.innerHeight);
        this.rnd.autoClear = false;
        this.rnd.clearDepth(); */
        FboUtils.renderToViewport(this.rnd, COMP);
        // FboUtils.drawTexture(this.glow.texture, this.rnd, 0, 0, window.innerWidth, window.innerHeight);

        this.rnd.setRenderTarget(null);
    }
}