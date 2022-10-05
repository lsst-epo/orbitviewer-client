import { MeshPhongMaterial } from "three";
import { BufferAttribute, BufferGeometry, ColorRepresentation, Line, LineBasicMaterial, Mesh, Object3D, SphereGeometry, Vector3 } from "three";
import { InteractiveObject } from "../../production/ui/popups/Raycaster";
import { isPortrait } from "../../production/utils/Helpers";
import { PlanetMaterial } from "../gfx/PlanetMaterial";
import { initMaterial } from "../gfx/ShaderLib";
import { EllipticalPath } from "./EllipticalPath";
import { PlanetOptions, PLANET_GEO } from "./Planet";
import { calculateOrbitByType, DEG_TO_RAD, OrbitElements, OrbitType } from "./SolarSystem";

const L_DUMMY = initMaterial(new LineBasicMaterial({
    color: 0xff0000
}));

const lockedPosition = {
	portrait: {
		distance: .03,
		offset: new Vector3(0, -.0055, 0)
	},
	landscape: {
		distance: .03,
		offset: new Vector3(.01, 0, 0)
	}
}

export class SolarElement extends Object3D implements InteractiveObject {
    parent:Object3D = new Object3D();
    mesh:Mesh;
    data:OrbitElements;
    orbitPath:EllipticalPath;
    private _selected:boolean = false;
    material:MeshPhongMaterial;
    target:Object3D;
	type: string;
  
    sunLine:Line;

    constructor(id:string, _data:OrbitElements, opts:PlanetOptions={}) {
        super();

        this.data = _data;
        this.type = id;
        this.name = id;

        let scl = .001;

        this.scale.multiplyScalar(scl);

        const lineGeo = new BufferGeometry();
        const pos = new Float32Array([0,0,0,10,10,10]);
        lineGeo.setAttribute('position', new BufferAttribute(pos, 3));
        this.sunLine = new Line(lineGeo, L_DUMMY);        

        this.orbitPath = new EllipticalPath(_data, scl*.8);

        this.mesh = new Mesh(PLANET_GEO, this.initMaterial(opts));
        this.parent.add(this.mesh);
        this.add(this.parent);
        this.target = this;
         
    }

    initMaterial(opts:PlanetOptions = {}){

        this.material = initMaterial(new MeshPhongMaterial({
            color: opts.color ? opts.color : 0xffffff,
            shininess: 0
        })) as MeshPhongMaterial;

        return this.material;
    }

    get lockedDistance():number {
        return isPortrait() ? lockedPosition.portrait.distance : lockedPosition.landscape.distance;
    }

    get lockedOffset():Vector3 {
        return isPortrait() ? lockedPosition.portrait.offset : lockedPosition.landscape.offset;          
    }

    update(d:number) {
        calculateOrbitByType(this.data, d, OrbitType.Elliptical, this.position);

        // const pos = this.sunLine.geometry.attributes.position;
        // const arr = pos.array as Float32Array;
        // arr[3] = this.position.x;
        // arr[4] = this.position.y;
        // arr[5] = this.position.z;
        
        // pos.needsUpdate = true;

        // this.mesh.updateMatrixWorld();
        // this.material.update();
        this.orbitPath.update(d, this.position, this.scale.x);

        this.orbitPath.ellipse.visible = this.visible;
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


