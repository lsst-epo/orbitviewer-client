import { Random } from "@jocabola/math";
import { Mesh, Object3D, SphereGeometry, TextureLoader } from "three";
import { PlanetMaterial } from "../gfx/PlanetMaterial";
import { EllipticalPath } from "./EllipticalPath";
import { calculateOrbitByType, OrbitElements, OrbitType } from "./SolarSystem";

const GEO = new SphereGeometry(1, 32, 16);
const TEX = new TextureLoader().load(window.location.origin + '/assets/textures/fake-earth.jpg');

export class Planet extends Object3D {
    mesh:Mesh;
    data:OrbitElements;
    orbitPath:EllipticalPath;
    rotationSpeed:number;
    private _selected:boolean = false;
    material:PlanetMaterial;

    constructor(_data:OrbitElements) {
        super();

        this.data = _data;        
        this.name = _data.id;
        

        this.material = new PlanetMaterial({
            shininess: 0,
            map: TEX
        }, {
            fresnelColor: 0x3333ff
        });

        this.mesh = new Mesh(GEO, this.material);
        this.mesh.scale.multiplyScalar(.02);
        this.add(this.mesh);
        // this.mesh.rotateZ(Random.randf(-Math.PI/4, Math.PI/4));

        this.orbitPath = new EllipticalPath(_data);       

        this.rotationSpeed = Random.randf(-1, 1);
    }

    update(d:number) {
        calculateOrbitByType(this.data, d, OrbitType.Elliptical, this.position);
        this.mesh.rotation.y = d * this.rotationSpeed;
        // this.mesh.updateMatrixWorld();
        this.material.update();
    }

    set selected(value:boolean) {
        this._selected = value;
        this.orbitPath.selected = value;
        this.material.selected = value;
    }

    get selected():boolean {
        return this._selected;
    }
}