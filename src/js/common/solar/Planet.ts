import { Random } from "@jocabola/math";
import { Mesh, Object3D, SphereGeometry, TextureLoader } from "three";
import { getPlanetMaterialInstance } from "../gfx/ShaderLib";
import { EllipticalPath } from "./EllipticalPath";
import { calculateOrbitByType, OrbitElements, OrbitType } from "./SolarSystem";

const GEO = new SphereGeometry(1, 32, 16);
const MAT = getPlanetMaterialInstance(new TextureLoader().load(window.location.origin + '/assets/textures/fake-earth.jpg'), 0x3333ff);

export class Planet extends Object3D {
    mesh:Mesh;
    data:OrbitElements;
    orbitPath:EllipticalPath;
    rotationSpeed:number;

    constructor(_data:OrbitElements) {
        super();

        this.data = _data;

        this.mesh = new Mesh(GEO, MAT);
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
    }
}