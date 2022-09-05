import { BufferAttribute, BufferGeometry, Line, LineBasicMaterial, Vector3 } from "three";
import { initMaterial } from "../gfx/ShaderLib";
import { calculateOrbitByType, OrbitElements, OrbitType } from "./SolarSystem";
import { SolarTimeManager } from "./SolarTime";

const MIN_DISTANCE = .05;
const MIN_POINTS = 10;

const LINE_MAT = initMaterial(new LineBasicMaterial({
    color: 0xcccccc
}));

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

    constructor(el:OrbitElements) {
        // build path
        const date = new Date();
        const first = new Vector3();

        let d = SolarTimeManager.getMJDonDate(date);
        calculateOrbitByType(el, d, OrbitType.Elliptical, first);
        this.pts.push(first);

        let curr = new Vector3();
        calculateOrbitByType(el, ++d, OrbitType.Elliptical, curr);
        const minD = MIN_DISTANCE * el.a;
        while(this.pts.length < MIN_POINTS || curr.distanceTo(this.pts[0]) > minD) {
            while(curr.distanceTo(this.pts[this.pts.length-1]) < minD) {
                calculateOrbitByType(el, ++d, OrbitType.Elliptical, curr);
            }

            this.pts.push(curr.clone());
        }

        // console.log(this.pts);

        const pos = [];

        for(const p of this.pts) {
            pos.push(p.x, p.y, p.z);
        }

        // close
        const p = this.pts[0];
        pos.push(p.x, p.y, p.z);
        
        const geo = new BufferGeometry();
        geo.setAttribute(
            'position',
            new BufferAttribute(
                new Float32Array(pos),
                3
            )
        );

        this.ellipse = new Line(geo, LINE_MAT);
    }
}