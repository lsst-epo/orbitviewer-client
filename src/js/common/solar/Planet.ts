import { MathUtils } from "@jocabola/math";
import { ColorRepresentation, DoubleSide, LineBasicMaterial, MeshPhongMaterial, SphereGeometry, TextureLoader, Vector3 } from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { isPortrait } from "../../production/utils/Helpers";
import { PlanetMaterial } from "../gfx/PlanetMaterial";
import { initMaterial } from "../gfx/ShaderLib";
import { SolarElement } from "./SolarElement";
import { cloneOrbitElements, DEG_TO_RAD, KM2AU, OrbitElements } from "./SolarSystem";

export const PLANET_GEO = new SphereGeometry(1, 32, 32);
const tLoader = new TextureLoader();

export const PLANET_SCALE = 100;

export type PlanetOptions = {
    color?:ColorRepresentation;
    mapURL?:string;
}

export type PlanetId = 'mercury'|'venus'|'earth'|'mars'|'jupiter'|'saturn'|'uranus'|'neptune';

const gltfLoader = new GLTFLoader();

// const L_DUMMY = initMaterial(new LineBasicMaterial({
//     color: 0xff0000
// }));


export class Planet extends SolarElement {
    material: PlanetMaterial;

    rotationSpeed:number; 
    type:PlanetId;

    constructor(id: PlanetId, _data:OrbitElements, opts:PlanetOptions={}) {
        super(id, _data, opts);

        this.mesh.visible = true;

        this.closeUp = true;

        // console.log(PlanetRadiusMap[this.type] * KM2AU);
        PlanetDataMap[this.type] = cloneOrbitElements(_data);
        let scl = PlanetRadiusMap[this.type] * KM2AU * PLANET_SCALE;
        this.scale.set(scl, scl, scl);
        // correct fresnel
        
        if(id === 'saturn') {
            // console.log('Houston, we\'ve got Saturn!');
            gltfLoader.load('/assets/models/ring.glb', (gltf) => {
                // console.log(gltf.scene);
                gltf.scene.scale.setScalar(2);
                gltf.scene.children[0].material = initMaterial(new MeshPhongMaterial({
                    side: DoubleSide,
                    // transparent: true,
                    map: tLoader.load(`/assets/textures/2k_saturn_ring_alpha.png`)
                }));
                /* gltf.scene.children[0].material = new PlanetMaterial({
                    side: DoubleSide,
                    // transparent: true,
                    map: tLoader.load(`/assets/textures/2k_saturn_ring_alpha.png`)
                }, {
                    fresnelWidth: .000001,
                    fresnelColor: 0x000033,
                    sunIntensity: .05

                }); */
                this.mesh.add(gltf.scene);
            })
        }

        // this.rotationSpeed = Random.randf(-1, 1);
        const rt = PlanetRotationMap[this.type] as PlanetRotationData;
        this.rotationSpeed = DEG_TO_RAD * (360 / rt.period);
        this.parent.rotation.z = DEG_TO_RAD * -(rt.axialTilt + _data.i);
    
    }

    initMaterial(opts?: PlanetOptions): PlanetMaterial {

        opts.mapURL = `/assets/textures/2k_${this.type}.jpg`;

        let fresnelWidth = .005;
        let sunIntensity = .5;
        const scl = PlanetRadiusMap[this.type] * KM2AU * PLANET_SCALE;

        const s = MathUtils.smoothstep(0, 0.234, scl);
        fresnelWidth = MathUtils.lerp(fresnelWidth, fresnelWidth*10, s);
        sunIntensity = MathUtils.lerp(.5, .05, s);

        this.material = new PlanetMaterial({
            color: opts.color ? opts.color : 0xffffff,
            shininess: 0,
            map: opts.mapURL ? tLoader.load(opts.mapURL) : null
        }, {
            fresnelColor: 0x000033,
            fresnelWidth: fresnelWidth,
            sunIntensity: sunIntensity
        });

        return this.material;
    }

    get lockedDistance():number {
        const lock = isPortrait() ? PlanetLockedMapPortrait[this.type] : PlanetLockedMap[this.type];
        return lock.distance;
    }

    get lockedOffset():Vector3 {
        const lock = isPortrait() ? PlanetLockedMapPortrait[this.type] : PlanetLockedMap[this.type];
        return lock.offset;
    }

    update(d:number) {
        super.update(d);
        const rt = PlanetRotationMap[this.type] as PlanetRotationData;
        this.mesh.rotation.y = rt.meridian * DEG_TO_RAD + d * this.rotationSpeed;
        this.material.update();
    }

}

export const PlanetRadiusMap:Record<PlanetId,number> = {
    'mercury': 2440,
    'venus': 6052,
    'earth': 6371,
    'mars': 3390,
    'jupiter': 69911,
    'saturn': 58232,
    'uranus': 25360,
    'neptune': 24620
}

export type PlanetRotationData = {
    axialTilt:number;
    period:number;
    meridian:number;
}

export const PlanetRotationMap:Record<PlanetId, PlanetRotationData> = {
    mercury: {
        axialTilt: 0.034,
        period: 58.6462,
        meridian: 329.5988
    },
    venus: {
        axialTilt: 177.36,
        period: 243.018,
        meridian: 160.20
    },
    earth: {
        axialTilt: 23.4392811,
        period: 1,
        meridian: 0
    },
    mars: {
        axialTilt: 25.19,
        period: 1.02595676,
        meridian: 176.049863
    },
    jupiter: {
        axialTilt: 3.13,
        period: 0.41354,
        meridian: 284.95
    },
    saturn: {
        axialTilt: 26.73,
        period: 0.44401,
        meridian: 38.90
    },
    uranus: {
        axialTilt: 97.77,
        period: 0.71833,
        meridian: 203.81
    },
    neptune: {
        axialTilt: 28.32,
        period: 0.67125,
        meridian: 249.978
    }
}

export type CameraLockPosition = {
    distance: number;
    offset: Vector3;
}

export const PlanetLockedMap:Record<PlanetId,CameraLockPosition> = {
    mercury: {
        distance: .015,
        offset: new Vector3(.0015, .0015, 0) // Ok
    },
    venus: {
        distance: .033,
        offset: new Vector3(.001, .0018, 0) // OK
    },
    earth: {
        distance: .03,
        offset: new Vector3(.0025, .0025, 0) // Ok
    },
    mars: {
        distance: .025,
        offset: new Vector3(.005, .0025, 0) // Ok
    },
    jupiter: {
        distance: .5,
        offset: new Vector3(-.05, .06, 0) // Ok
    },
    saturn: {
        distance: .35,
        offset: new Vector3(-.025, -.04, 0) // Ok
    },
    uranus: {
        distance: .15,
        offset: new Vector3(-.01, .01, 0) // ok
    },
    neptune: {
        distance: .15,
        offset: new Vector3(-.009, .01, 0)
    }
}

export const PlanetLockedMapPortrait:Record<PlanetId,CameraLockPosition> = {
    mercury: {
        distance: .025,
        offset: new Vector3(0, -0.005, 0)
    },
    venus: {
        distance: .038,
        offset: new Vector3(0, -0.005, 0)
    },
    earth: {
        distance: .038,
        offset: new Vector3(0, -0.005, 0)
    },
    mars: {
        distance: .03,
        offset: new Vector3(0, -0.005, 0)
    },
    jupiter: {
        distance: .45,
        offset: new Vector3(0, -0.07, 0)
    },
    saturn: {
        distance: .5,
        offset: new Vector3(0, -0.08, 0)
    },
    uranus: {
        distance: .2,
        offset: new Vector3(0, -0.03, 0)
    },
    neptune: {
        distance: .2,
        offset: new Vector3(0.02, -0.04, 0)
    }
}

export const PlanetDataMap:Record<PlanetId,OrbitElements> = {
    earth: null,
    mercury: null,
    venus: null,
    mars: null,
    jupiter: null,
    saturn: null,
    uranus: null,
    neptune: null
}