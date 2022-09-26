/**
 * Solar Particles
 * 
 * This class creates a fixed buffer of instanced quads.
 * This buffer will be feed by orbit elements data and
 * visualize accordingly
 */

import { FboUtils } from "@jocabola/gfx";
import { MathUtils } from "@jocabola/math";
import { Color, InstancedMesh, MeshPhongMaterial, Object3D, PerspectiveCamera, PlaneGeometry, Vector3, WebGLMultipleRenderTargets, WebGLRenderer } from "three";
import { VISUAL_SETTINGS } from "../core/Globals";
import { COMP_SP_NORMAL, initMaterial } from "../gfx/ShaderLib";
import { GPUSim } from "./GPUSim";
import { calculateOrbit, OrbitElements } from "./SolarSystem";

const MAX = VISUAL_SETTINGS[VISUAL_SETTINGS.current];

const GEO = new PlaneGeometry();
const MAT = initMaterial(new MeshPhongMaterial({
    shininess: 0,
    emissive: 0xffffff,
    emissiveIntensity: .25,
    transparent: true,
    // depthTest: false,
    // blending: AdditiveBlending
})) as MeshPhongMaterial;

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
    maps:WebGLMultipleRenderTargets;
    sim:GPUSim;

    constructor(renderer:WebGLRenderer){
        this.sim = new GPUSim(renderer);

        this.mesh = new InstancedMesh(GEO, MAT, MAX);
        this.mesh.visible = false;
        for(let i=0; i<MAX; i++) {
            this.mesh.setColorAt(i, COLORS[0]);
        }

        this.maps = new WebGLMultipleRenderTargets(512, 512, 3);
        this.maps.texture[0].name = 'normal';
        this.maps.texture[1].name = 'alpha';
        this.maps.texture[2].name = 'diffuse';
        FboUtils.renderToFbo(this.maps, renderer, COMP_SP_NORMAL);
        renderer.setRenderTarget(null);

        MAT.normalMap = this.maps.texture[0];
        MAT.alphaMap = this.maps.texture[1];
        MAT.map = this.maps.texture[2];
        // MAT.emissiveMap = this.maps.texture[2];
        MAT.alphaTest = .01;
    }

    /**
     * Updates the associated data
     */
    set data(value:Array<OrbitElements>) {
        this._data = value;
        const count = Math.min(MAX, this._data.length);

        this.sim.data = value;

        for(let i=0; i<count; i++) {
            const el = this._data[i];
            this.mesh.setColorAt(i, COLORS[el.type]);
            // this.mesh.setColorAt(i, col);
        }

        this.mesh.instanceColor.needsUpdate = true;
    }

    /**
     * 
     * @param d - MJD of the simulation
     * @param camera - Camera rendering the simulation
     */
    update(d:number, camera:PerspectiveCamera) {
        this.mesh.visible = this._data.length > 0;
        if(!this.mesh.visible) return;

        this.sim.render();

        const count = Math.min(MAX, this._data.length);

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
        }

        this.mesh.instanceMatrix.needsUpdate = true;
    }
}