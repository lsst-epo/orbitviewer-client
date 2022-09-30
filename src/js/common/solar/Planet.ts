import { MathUtils } from "@jocabola/math";
import { ColorRepresentation, Mesh, Object3D, SphereGeometry, TextureLoader, Vector3 } from "three";
import { InteractiveObject } from "../../production/ui/expandable-items/Raycaster";
import { PlanetMaterial } from "../gfx/PlanetMaterial";
import { EllipticalPath } from "./EllipticalPath";
import { calculateOrbitByType, DEG_TO_RAD, KM2AU, OrbitElements, OrbitType } from "./SolarSystem";

export const PLANET_GEO = new SphereGeometry(1, 32, 32);
const tLoader = new TextureLoader();

export const PLANET_SCALE = 100;

export type PlanetOptions = {
    color?:ColorRepresentation;
    mapURL?:string;
}

export class Planet extends Object3D implements InteractiveObject {
    mesh:Mesh;
    data:OrbitElements;
    orbitPath:EllipticalPath;
    rotationSpeed:number; 
    private _selected:boolean = false;
    material:PlanetMaterial;
    type:string;
    dwarf:boolean = false;
    target:Object3D;
    lockedDistance:number = 0;
    lockedOffset:Vector3 = new Vector3();

    constructor(id: string, dwarf:boolean, _data:OrbitElements, opts:PlanetOptions={}) {
        super();

        this.type = id;        
        this.dwarf = dwarf;

        if(!this.dwarf) {
            opts.mapURL = `/assets/textures/2k_${this.type}.jpg`;
        }

        this.data = _data;        
        this.name = id;

        let fresnelWidth = .005;
        let sunIntensity = .5;
        let scl = .003;

        if(!this.dwarf) {
            // console.log(PlanetRadiusMap[this.type] * KM2AU);
            scl = PlanetRadiusMap[this.type] * KM2AU * PLANET_SCALE;
            this.scale.multiplyScalar(scl);
            // correct fresnel
            const s = MathUtils.smoothstep(0, 0.234, scl);
            fresnelWidth = MathUtils.lerp(fresnelWidth, fresnelWidth*10, s);
            sunIntensity = MathUtils.lerp(.5, .05, s);

            const lock = PlanetLockedMap[this.type];
            this.lockedDistance = lock.distance;
            this.lockedOffset.copy(lock.offset);
            
        } else {
            this.scale.multiplyScalar(.003);
        }

        this.material = new PlanetMaterial({
            color: opts.color ? opts.color : 0xffffff,
            shininess: 0,
            map: opts.mapURL ? tLoader.load(opts.mapURL) : null
        }, {
            fresnelColor: 0x000033,
            fresnelWidth: fresnelWidth,
            sunIntensity: sunIntensity
        });

        this.orbitPath = new EllipticalPath(_data, scl*.8);

        this.mesh = new Mesh(PLANET_GEO, this.material);
        this.add(this.mesh);
        this.target = this;
        // this.add(this.orbitPath.ellipse)
        // this.mesh.rotateZ(Random.randf(-Math.PI/4, Math.PI/4));

        // this.rotationSpeed = Random.randf(-1, 1);
        if(!this.dwarf) {
            const rt = PlanetRotationMap[this.type] as PlanetRotationData;
            this.rotationSpeed = DEG_TO_RAD * rt.period;
            this.mesh.rotation.z = DEG_TO_RAD * rt.axialTilt;
        } else {
            this.rotationSpeed = 0;
        }
    }

    update(d:number) {
        calculateOrbitByType(this.data, d, OrbitType.Elliptical, this.position);
        this.mesh.rotation.y = d * this.rotationSpeed;
        // this.mesh.updateMatrixWorld();
        this.material.update();
        this.orbitPath.update(d, this.position, this.scale.x);
    }

    set selected(value:boolean) {
        this._selected = value;
        this.orbitPath.selected = value;
        // this.material.selected = value;
    }

    get selected():boolean {
        return this._selected;
    }
}

export const PlanetRadiusMap = {
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
}

export type RotationMap = {
    mercury:PlanetRotationData,
    venus:PlanetRotationData,
    earth:PlanetRotationData,
    mars:PlanetRotationData,
    jupiter:PlanetRotationData,
    saturn:PlanetRotationData,
    uranus:PlanetRotationData,
    neptune:PlanetRotationData
}

export const PlanetRotationMap:RotationMap = {
    mercury: {
        axialTilt: 0.034,
        period: 58.6462
    },
    venus: {
        axialTilt: 177.36,
        period: 243.018
    },
    earth: {
        axialTilt: 23.4392811,
        period: 1
    },
    mars: {
        axialTilt: 25.19,
        period: 1.02595676
    },
    jupiter: {
        axialTilt: 3.13,
        period: 0.41354
    },
    saturn: {
        axialTilt: 26.73,
        period: 0.44401
    },
    uranus: {
        axialTilt: 97.77,
        period: 0.71833
    },
    neptune: {
        axialTilt: 28.32,
        period: 0.67125
    }
}

export const PlanetLockedMap = {
    earth: {
        distance: .05,
        offset: new Vector3(-.01, .005, 0)
    },
    mercury: {
        distance: .015,
        offset: new Vector3(-.0025, .0015, 0)
    },
    venus: {
        distance: .05,
        offset: new Vector3(-.01, .01, 0)
    },
    mars: {
        distance: .05,
        offset: new Vector3(-.01, .01, 0)
    },
    jupiter: {
        distance: .25,
        offset: new Vector3(-.05, .05, 0)
    },
    saturn: {
        distance: .25,
        offset: new Vector3(-.05, .05, 0)
    },
    uranus: {
        distance: .05,
        offset: new Vector3(-.01, .01, 0)
    },
    neptune: {
        distance: .05,
        offset: new Vector3(-.01, .01, 0)
    }
}