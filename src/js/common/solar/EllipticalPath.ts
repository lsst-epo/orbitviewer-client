import { MathUtils } from "@jocabola/math";
import { Box3, BufferAttribute, BufferGeometry, Group, Line, Object3D, Vector3 } from "three";
import { TrajectoryMaterial } from "../gfx/TrajectoryMaterial";
import { PLANET_SCALE } from "./Planet";
import { calculateOrbitByType, OrbitElements, OrbitType } from "./SolarSystem";
import { SolarTimeManager } from "./SolarTime";

const MIN_DISTANCE = 5;
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
    ellipse:Object3D;
    orbitElements:OrbitElements;
    material:TrajectoryMaterial;
    selected:boolean = false;
    hidden:boolean = false;
    boundingBox:Box3;
    type:OrbitType;

    constructor(el:OrbitElements, r:number) {
        // build path
        const date = new Date();
        const first = new Vector3();

        if(el.type != OrbitType.Elliptical) {
            console.warn("Object does not have an elliptical orbit");
        }

        this.type = el.type;

        this.orbitElements = el;

        if(el.type === OrbitType.Elliptical) {
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
            let k = 0;

            for(const p of this.pts) {
                pos.push(p.x, p.y, p.z);
                weight.push(k++/this.pts.length);
            }

            // close
            const p = this.pts[0];
            pos.push(p.x, p.y, p.z);
            weight.push(0);
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

            this.ellipse = new Group();
            const mat = new TrajectoryMaterial({
                color: 0x666666,
                transparent: true
            }, el);
            this.material = mat;

            const l = new Line(geo, mat);
            this.ellipse.add(l);

            geo.computeBoundingBox();
            this.boundingBox = geo.boundingBox;

            const dR = Math.min(r/20, .000025) / PLANET_SCALE;

            for (let i=0; i<20; i++) {
                const l1 = new Line(geo, mat);
                this.ellipse.add(l1);
                l1.position.set(dR*i, 0, 0); 

                const l2 = new Line(geo, mat);
                this.ellipse.add(l2);
                l2.position.set(-dR*i, 0, 0); 

                /* const l2 = new Line(geo, mat);
                this.ellipse.add(l2);
                l2.position.set(0, .0001*i, 0);  */

                const l3 = new Line(geo, mat);
                this.ellipse.add(l3);
                l3.position.set(0, 0, dR*i); 

                /* const l4 = new Line(geo, mat);
                this.ellipse.add(l4);
                l4.position.set(0, 0, -dR*i);  */
            }
        } else {
            this.boundingBox = new Box3(
                new Vector3(),
                new Vector3()
            );

            this.ellipse = new Object3D();
        }
    }

    update(d:number, target:Vector3, radius:number) {
        if(this.type !== OrbitType.Elliptical) return;
        const mat = this.material;
        if(mat.shader) {
            mat.shader.uniforms.d.value = d;
            mat.shader.uniforms.bodyPos.value.copy(target);
            mat.shader.uniforms.dRadius.value = radius;

            const sel = mat.shader.uniforms.selected;
            sel.value = MathUtils.lerp(sel.value, this.selected ? 1 : 0, .16);

            const op = mat.shader.uniforms.globalOpacity;
            op.value = MathUtils.lerp(op.value, this.hidden ? 0 : 1, .16);
        }
    }
}