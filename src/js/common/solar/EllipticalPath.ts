import { BufferAttribute, BufferGeometry, Line, Vector3 } from "three";
import { TrajectoryMaterial } from "../gfx/TrajectoryMaterial";
import { calculateOrbitByType, OrbitElements, OrbitType } from "./SolarSystem";
import { SolarTimeManager } from "./SolarTime";

const MIN_DISTANCE = .05;
const MIN_POINTS = 10;

/* const defaultColor = new Color(0x333333);
const selectedColor = new Color(0xcccccc); */

export const TRAJ_LINE_MAT = new TrajectoryMaterial({
    color: 0x666666
});

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
    firstD:number;
    lastD:number;

    constructor(el:OrbitElements) {
        // build path
        const date = new Date();
        const first = new Vector3();

        let d = SolarTimeManager.getMJDonDate(date);
        calculateOrbitByType(el, d, OrbitType.Elliptical, first);
        this.pts.push(first);

        this.firstD = d;

        let curr = new Vector3();
        calculateOrbitByType(el, ++d, OrbitType.Elliptical, curr);
        const minD = MIN_DISTANCE * el.a;
        while(this.pts.length < MIN_POINTS || curr.distanceTo(this.pts[0]) > minD) {
            while(curr.distanceTo(this.pts[this.pts.length-1]) < minD) {
                calculateOrbitByType(el, ++d, OrbitType.Elliptical, curr);
                this.lastD = d;
            }

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
            'selected',
            new BufferAttribute(
                new Float32Array(selected),
                1
            )
        );

        this.ellipse = new Line(geo, TRAJ_LINE_MAT);
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
        const t = this.lastD - this.firstD;
        const dT = d - this.firstD;
        const geo = this.ellipse.geometry as BufferGeometry;
        const weight = geo.attributes.weight;
        const arr = weight.array as Float32Array;

        const p = (Math.abs(dT) / t) % 1;

        for(let i=0;i<arr.length;i++) {
            let w = (i/(arr.length-1)) % 1;
            arr[i] = w;
        }

        weight.needsUpdate = true;
    }
}