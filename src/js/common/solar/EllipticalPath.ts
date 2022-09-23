import { BufferAttribute, BufferGeometry, Line, Vector3 } from "three";
import { TrajectoryMaterial } from "../gfx/TrajectoryMaterial";
import { calculateOrbitByType, OrbitElements, OrbitType } from "./SolarSystem";
import { SolarTimeManager } from "./SolarTime";

const MIN_DISTANCE = .05;
const MIN_POINTS = 10;

/**
 * Elliptical Path
 * This class stores an array of points for
 * drawing an elliptical orbit path of a
 * given solar system object.
 * It will be calculated from today's date into
 * the future and it will use adaptive steps
 * depending on its semi-major axis (a)
 */
export class EllipticalPath {
    pts:Array<Vector3> = [];
    ellipse:Line;
    orbitElements:OrbitElements;

    constructor(el:OrbitElements) {
        // build path
        const date = new Date();
        const first = new Vector3();

        this.orbitElements = el;

        let d = SolarTimeManager.getMJDonDate(date);
        calculateOrbitByType(el, d, OrbitType.Elliptical, first);
        this.pts.push(first);

        const dt = [];
        dt.push(0);
        let pD = d;

        let curr = new Vector3();
        calculateOrbitByType(el, ++d, OrbitType.Elliptical, curr);
        const minD = MIN_DISTANCE * el.a;
        while(this.pts.length < MIN_POINTS || curr.distanceTo(this.pts[0]) > minD) {
            while(curr.distanceTo(this.pts[this.pts.length-1]) < minD) {
                calculateOrbitByType(el, ++d, OrbitType.Elliptical, curr);
            }

            dt.push(d-pD);
            // pD = d;
            this.pts.push(curr.clone());
        }

        const pos = [];
        const weight = [];
        const selected = [];
        let k = 0;

        for(const p of this.pts) {
            pos.push(p.x, p.y, p.z);
            weight.push(k++/this.pts.length);
            selected.push(0);
        }

        // close
        const p = this.pts[0];
        pos.push(p.x, p.y, p.z);
        weight.push(1);
        selected.push(0);
        dt.push(0);
        
        const geo = new BufferGeometry();
        geo.setAttribute(
            'position',
            new BufferAttribute(
                new Float32Array(pos),
                3
            )
        );

        geo.setAttribute(
            'weight',
            new BufferAttribute(
                new Float32Array(weight),
                1
            )
        );

        geo.setAttribute(
            'dt',
            new BufferAttribute(
                new Float32Array(dt),
                1
            )
        );

        geo.setAttribute(
            'selected',
            new BufferAttribute(
                new Float32Array(selected),
                1
            )
        );

        this.ellipse = new Line(geo, new TrajectoryMaterial({
            color: 0x666666,
            transparent: true
        }, el));
    }

    set selected(value:boolean) {
        const selected = this.ellipse.geometry.attributes.selected;

        const arr = selected.array as Float32Array;
        const v = value ? 1 : 0;

        for(let i=0; i<selected.count; i++) {
            arr[i] = v;
        }

        selected.needsUpdate = true;
    }

    update(d:number) {
        const mat = this.ellipse.material as TrajectoryMaterial;
        if(mat.shader) {
            mat.shader.uniforms.d.value = d;
        }
    }
}