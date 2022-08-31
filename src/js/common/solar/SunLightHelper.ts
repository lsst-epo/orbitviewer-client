import { BufferAttribute, BufferGeometry, ColorRepresentation, Group, Line, LineBasicMaterial, Object3D, PointLight } from "three";
import { initMaterial } from "../gfx/ShaderLib";

const getGeo = (nPts:number=100):BufferGeometry => {
    const geo = new BufferGeometry();
    const pos = [];

    for(let i=0;i<nPts;i++) {
        const a = 2 * Math.PI * i / (nPts-1);
        pos.push(
            Math.cos(a),
            Math.sin(a),
            0
        )
    }

    geo.setAttribute('position', new BufferAttribute(
        new Float32Array(pos),
        3
    ));

    return geo;
}

export class SunLightHelper extends Object3D {
    target:PointLight;
    distance:Group;
    decay:Group;

    /**
    * SunLightHelper
    * @param light PointLight target reference
    * @param color1 Color of distance field
    * @param color2 Color of decay field
    */

    constructor(light:PointLight, color1:ColorRepresentation=0xffffff, color2:ColorRepresentation=0x333333) {
        super();
        this.target = light;

        const geo = getGeo();

        const mat1 = initMaterial(new LineBasicMaterial({
            color: color1,
            opacity: 0.5,
            transparent: true
        }));
        const mat2 = initMaterial(new LineBasicMaterial({
            color: color2,
            opacity: 0.5,
            transparent: true
        }));

        this.distance = new Group();
        this.add(this.distance);

        const ring1 = new Line(geo, mat1);
        this.distance.add(ring1);

        const ring2 = new Line(geo, mat1);
        this.distance.add(ring2);
        ring2.rotateY(Math.PI/4);

        const ring3 = new Line(geo, mat1);
        this.distance.add(ring3);
        ring3.rotateY(-Math.PI/4);

        const ring4 = new Line(geo, mat1);
        this.distance.add(ring4);
        ring4.rotateY(Math.PI/2);

        this.decay = new Group();
        this.add(this.decay);
        
        const ring12 = new Line(geo, mat2);
        ring12.rotateX(Math.PI/5);
        this.decay.add(ring12);

        const ring22 = new Line(geo, mat2);
        ring22.rotateY(Math.PI/2);
        ring22.rotateX(Math.PI/5);
        this.decay.add(ring22);

        this.update();

    }

    update() {
        const light = this.target;
        light.getWorldPosition(this.position);
        this.distance.scale.setScalar(light.distance);
        this.decay.scale.setScalar(light.distance / Math.max(1, light.decay));
    }
}