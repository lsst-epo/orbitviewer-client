/**
 * Solar Particles
 * 
 * This class creates a fixed buffer of instanced quads.
 * This buffer will be feed by orbit elements data and
 * visualize accordingly
 */

import { FboUtils } from "@jocabola/gfx";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, InstancedMesh, Object3D, PerspectiveCamera, Points, ShaderMaterial, SphereGeometry, Vector3, WebGLMultipleRenderTargets, WebGLRenderer } from "three";
import { GPU_SIM_SIZES, VISUAL_SETTINGS } from "../core/Globals";
import { COMP_SP_NORMAL } from "../gfx/ShaderLib";
import { GPUSim, SimQuality } from "./GPUSim";
import { OrbitElements } from "./SolarSystem";


import { Random } from "@jocabola/math";
import p_frag from '../../../glsl/sim/particles.frag';
import p_vert from '../../../glsl/sim/particles.vert';

import { gsap } from 'gsap/gsap-core';



const GEO = new SphereGeometry(.01, 32, 32);
/* const MAT = new SolarParticlesMaterial({
    shininess: 0,
    emissive: 0xffffff,
    emissiveIntensity: .25,
    // transparent: true,
    // depthTest: false,
    // blending: AdditiveBlending
}); */

const MAT = new ShaderMaterial({
    vertexShader: p_vert,
    fragmentShader: p_frag,
    transparent: true,
    vertexColors: true,
    uniforms: {
        computedPosition: {
            value: null
        },
        opacity: {
            value: 1
        }
    },
    blending: AdditiveBlending
});

const SCALE = {
    min: .00012,
    max: .5
};

const dummy = new Object3D();
const tmp = new Vector3();

const COLORS:Array<Color> = [
    new Color(0xcc00ff), // Elliptical
    new Color(0xff3311), // parabolic
    new Color(0x11aa11), // near parabolic
    new Color(0x11aaff) // hyperbolic
];

export class SolarParticles {
    private _data:Array<OrbitElements> = [];
    mesh:InstancedMesh;
    points:Points;
    maps:WebGLMultipleRenderTargets;
    sim:GPUSim;
    quality:SimQuality;

    constructor(){}

    init(renderer:WebGLRenderer){
        this.sim = new GPUSim(renderer);
        this.quality = this.sim.qualitySettings;
        MAT.uniforms.computedPosition.value = this.sim.texture;

        // const count = VISUAL_SETTINGS[VISUAL_SETTINGS.current];

        /* this.mesh = new InstancedMesh(GEO, MAT, count);
        // this.mesh.visible = false;
        for(let i=0; i<count; i++) {
            this.mesh.setColorAt(i, COLORS[0]);
        } */

        /* const geo = new BufferGeometry();
        const pos = [];

        for(let i=0; i<count; i++) {
            // this.mesh.setColorAt(i, COLORS[0]);
            pos.push(
                Random.randf(-500, 500),
                Random.randf(-500, 500),
                Random.randf(-500, 500)
            )
        }

        const siz = GPU_SIM_SIZES[VISUAL_SETTINGS.current];
        const w = siz.width;
        const h = siz.height;

        const simUV = [];

        for(let i=0; i<w; i++){
            for(let j=0; j<h; j++){
                simUV.push(i/w, j/h);
            }
        }

        // console.log(count, simUV.length/2, pos.length/3);
        
        geo.setAttribute(
            'position',
            new BufferAttribute(
                new Float32Array(pos),
                3
            )
        );

        geo.setAttribute(
            'simUV',
            new BufferAttribute(
                new Float32Array(simUV),
                2
            )
        ); */

        this.points = new Points(this.createPointsGeo(), MAT);

        this.maps = new WebGLMultipleRenderTargets(512, 512, 3);
        this.maps.texture[0].name = 'normal';
        this.maps.texture[1].name = 'alpha';
        this.maps.texture[2].name = 'diffuse';
        FboUtils.renderToFbo(this.maps, renderer, COMP_SP_NORMAL);
        renderer.setRenderTarget(null);

        // MAT.uniforms.normalMap.value = this.maps.texture[0];
        // MAT.uniforms.alphaMap.value = this.maps.texture[1];
        // MAT.uniforms.map.value = this.maps.texture[2];
        // MAT.emissiveMap = this.maps.texture[2];
        // MAT.alphaTest = .01;
    }

    private createPointsGeo():BufferGeometry {
        const count = VISUAL_SETTINGS[VISUAL_SETTINGS.current];

        const geo = new BufferGeometry();
        const pos = [];
        const color = [];
        const col = COLORS[0];

        for(let i=0; i<count; i++) {
            // this.mesh.setColorAt(i, COLORS[0]);
            color.push(col.r, col.g, col.b);
            pos.push(
                Random.randf(-500, 500),
                Random.randf(-500, 500),
                Random.randf(-500, 500)
            )
        }

        const siz = GPU_SIM_SIZES[VISUAL_SETTINGS.current];
        const w = siz.width;
        const h = siz.height;

        const simUV = [];

        for(let i=0; i<w; i++){
            for(let j=0; j<h; j++){
                simUV.push(i/(w-1), j/(h-1));
            }
        }

        geo.setAttribute(
            'position',
            new BufferAttribute(
                new Float32Array(pos),
                3
            )
        );

        geo.setAttribute(
            'color',
            new BufferAttribute(
                new Float32Array(color),
                3
            )
        );

        geo.setAttribute(
            'simUV',
            new BufferAttribute(
                new Float32Array(simUV),
                2
            )
        );

        return geo;
    }

    /**
     * Updates the associated data
     */
    set data(value:Array<OrbitElements>) {
        const MAX = VISUAL_SETTINGS[VISUAL_SETTINGS.current];
        if(this.quality != VISUAL_SETTINGS.current){
            this.quality = VISUAL_SETTINGS.current as SimQuality;
            this.points.geometry.dispose();
            this.points.geometry = this.createPointsGeo();
        }
        this._data = value;
        const count = Math.min(MAX, this._data.length);

        this.sim.data = value;

        const color = this.points.geometry.attributes.color;
        const arr = color.array as Float32Array;

        for(let i=0; i<count; i++) {
            const el = this._data[i];
            const col = COLORS[el.type];
            arr[i*3] = col.r;
            arr[i*3 + 1] = col.g;
            arr[i*3 + 2] = col.b;
            // this.mesh.setColorAt(i, COLORS[el.type]);
            // this.mesh.setColorAt(i, col);
        }

        // this.mesh.instanceColor.needsUpdate = true;
        color.needsUpdate = true;
    }

    /**
     * Sets state of particles (opacity)
     */
    set highlighted(value:boolean) {
        const u = MAT.uniforms;
        gsap.killTweensOf(u.opacity);
        gsap.to(u.opacity, {value: value ? 1 : .25, duration: 2});
    }

    /**
     * 
     * @param d - MJD of the simulation
     * @param camera - Camera rendering the simulation
     */
    update(d:number, camera:PerspectiveCamera) {
        /* this.mesh.visible = this._data.length > 0;
        if(!this.mesh.visible) return; */

        this.sim.render(d);
        /* const mat = this.mesh.material as SolarParticlesMaterial;
        if(mat.shaderRef != null) {
            mat.shaderRef.uniforms.computedPosition.value = this.sim.texture;
        } */

        /* const count = Math.min(MAX, this._data.length);

        for(let i=0; i<count; i++) {
            const el = this._data[i];
            dummy.matrix.identity();
            calculateOrbit(el, d, dummy.position);
            
            tmp.copy(dummy.position).sub(camera.position);
            const p = MathUtils.smoothstep(0, 200, tmp.length());
            dummy.scale.setScalar(
                MathUtils.mix(SCALE.min, SCALE.max, p)
            );
            dummy.lookAt(camera.position);

            dummy.updateMatrix();
            this.mesh.setMatrixAt(i, dummy.matrix);
        }

        for(let i=count; i<MAX; i++) {
            dummy.matrix.identity();
            dummy.scale.setScalar(0); // make invisible
            dummy.updateMatrix();
            this.mesh.setMatrixAt(i, dummy.matrix);
        } */

        // this.mesh.instanceMatrix.needsUpdate = true;
    }
}

