
import { Object3D, PerspectiveCamera, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CONTROLS, DEV } from "./Globals";

import { MathUtils } from "@jocabola/math";
import { gsap } from "gsap/gsap-core";
import { InteractiveObject } from "../solar/SolarElement";

export const DEFAULT_CAM_POS:Vector3 = new Vector3 (0,300,1000);

export enum CameraMode {
    ORBIT,
    LOCKED,
    DISABLED
}

export const CameraSettings = {
    orbit: {
        min: CONTROLS.min,
        max: CONTROLS.max,
        damping: .1,
        zoomSpeed: 1.2
    },
    traveling: {
        easing: .06
    }
}

const TARGET = {
    obj: new Object3D()
}

const origin = new Vector3();
const tmp = new Vector3();

export type ShpericalCoords = {
    radius:number;
    angle:number;
    elevation:number;
}

const sphericalCoords:ShpericalCoords = {
    radius: 0,
    angle: 0,
    elevation: 0
}

const prevSC:ShpericalCoords = {
    radius: 0,
    angle: 0,
    elevation: 0
}

/**
 * Camera Controller Class
 * Singleton approach
 */
class CameraController {
    private initialized:boolean = false;
    controls:OrbitControls;
    mode:CameraMode = CameraMode.DISABLED;
    cam:PerspectiveCamera;
    private orbit:boolean = false;
    private currentTarget:InteractiveObject = null;
    private unlocking:boolean = false;
    private prevDistance:number;
    aperture:number = 500;
    focalDistance:number = 0;
    dofPower:number = 0;

    get active():boolean {
        return this.initialized;
    }
    
    init(camera:PerspectiveCamera, domEl:HTMLElement) {
        if(this.initialized) return console.warn("CameraController already initialized!");
        this.initialized = true;
        this.controls = new OrbitControls(camera, domEl);
        this.cam = camera;
        this.mode = CameraMode.ORBIT;
        const s = CameraSettings.orbit;
        CONTROLS.orbit = this.controls;
        this.controls.enablePan = DEV;
        this.controls.minDistance = s.min;
        this.controls.maxDistance = s.max;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = s.damping;
        this.controls.zoomSpeed = s.zoomSpeed;

        /* this.cam['aperture'] = this.aperture;
        this.cam['focalDistance'] = this.focalDistance; */

        const sc = this.getSC(DEFAULT_CAM_POS);
        this.copySC(sc, sphericalCoords);
        this.copySC(sc, prevSC);
    }

    private getSC(p:Vector3, offset:Vector3=null):ShpericalCoords {
        let x = p.x;
        let y = p.y;
        let z = p.z;

        if(offset) {
            x += offset.x;
            y += offset.y;
            z += offset.z;
        }

        const R = Math.sqrt(x*x+z*z);
        const angle = Math.atan2(z, x);

        return {
            angle: angle,
            radius: R,
            elevation: y
        }
    }

    private refreshSC() {
        const sc = this.getSC(this.cam.position);
        this.copySC(sc, sphericalCoords);
    }

    private copySC(src:ShpericalCoords, dst:ShpericalCoords) {
        dst.radius = src.radius;
        dst.angle = src.angle;
        dst.elevation = src.elevation;
    }

    private updateTarget() {
        const target = this.currentTarget;
        const R = sphericalCoords.radius;
        const d = target ? target.lockedDistance * .025 : .001;
        let x = R * Math.cos(sphericalCoords.angle);
        let y = sphericalCoords.elevation;
        const z = R * Math.sin(sphericalCoords.angle);

        if(!this.unlocking) {
            x += d * Math.cos(performance.now() * .0005 + 1);
            y += d * Math.sin(performance.now() * .0005);
        }

        TARGET.obj.position.set(x,y,z);
    }

    private getTargetSC(target:InteractiveObject):ShpericalCoords {
        const sc = this.getSC(target.position, target.lockedOffset);
        const dA = Math.abs(sphericalCoords.angle - sc.angle);

        if(dA > Math.PI) {
            console.log('correct angle');
            
            if(sc.angle > Math.PI) sc.angle += 2*Math.PI;
            else sc.angle -= 2*Math.PI;
        }

        return sc;
    }

    goToTarget(target:InteractiveObject, orbitAround:boolean=false, unlockAfter:boolean=false) {
        if(!this.initialized) return console.warn("CameraController not initialized! Please run CameraManager.init() first.");
        this.killTweens();
        this.mode = CameraMode.LOCKED;
        this.currentTarget = target;
        this.refreshSC();
        this.copySC(sphericalCoords, prevSC);
        const sc = this.getTargetSC(target);

        this.unlocking = false;

        gsap.to(
            sphericalCoords, {
                radius: sc.radius + target.lockedDistance,
                angle: sc.angle,
                elevation: sc.elevation,
                duration: 4,
                ease: "expo.inOut",
                onComplete: () => {
                    sphericalCoords.angle = sphericalCoords.angle % (2 * Math.PI);
                    if(unlockAfter) {
                        this.mode = CameraMode.ORBIT;
                    }
                }
            }
        );
        this.orbit = orbitAround;
    }

    private measureSCDiff(sc1:ShpericalCoords, sc2:ShpericalCoords):number {
        let d = Math.abs(sc2.radius-sc1.radius);
        d += Math.abs(sc1.elevation-sc2.elevation);
        d += Math.abs(sc1.angle - sc2.angle);

        return d;
    }

    private killTweens() {
        gsap.killTweensOf(sphericalCoords);
        gsap.killTweensOf(this.cam.position);
        gsap.killTweensOf(this.cam.quaternion);
    }

    unlock() {
        if(!this.initialized) return console.warn("CameraController not initialized! Please run CameraManager.init() first.");
        this.mode = CameraMode.LOCKED;
        this.killTweens();
        this.orbit = false;

        this.unlocking = true;
        this.currentTarget = null;

        this.prevDistance = 10000000;

        gsap.to(sphericalCoords, {
            radius: prevSC.radius,
            angle: prevSC.angle,
            elevation: prevSC.elevation,
            duration: 4,
            ease: 'expo.inOut',
            /* onComplete: () => {
                this.mode = CameraMode.ORBIT;
                this.killTweens();
                this.unlocking = false;
            } */
        });
    }

    reset() {
        if(!this.initialized) return console.warn("CameraController not initialized! Please run CameraManager.init() first.");
        const sc = this.getSC(DEFAULT_CAM_POS);
        this.copySC(sc, prevSC)
        this.unlock();
    }

    update() {
        if(!this.initialized) return;
        this.controls.enabled = this.mode === CameraMode.ORBIT;
        if(this.controls.enabled) {
            // this.aperture = 200;
            // this.focalDistance = 10;
            this.dofPower = MathUtils.lerp(this.dofPower, 0, .016);
            this.controls.update();
            this.refreshSC();
        }
        if(this.mode === CameraMode.LOCKED) {
            this.focalDistance = this.currentTarget?.lockedDistance;

            this.aperture = 1;
            if(this.orbit) {
                const t = performance.now() * .001 * .025;
                tmp.copy(this.currentTarget.target.position);
                tmp.x += this.currentTarget.lockedDistance * Math.cos(t);
                tmp.z += this.currentTarget.lockedDistance * Math.sin(t);
                tmp.y += .25 * Math.sin(t * 1.5);
                this.cam.position.lerp(tmp, CameraSettings.traveling.easing);
                // this.cam.lookAt(this.currentTarget.target.position);
            } else {
                this.updateTarget();
                
                this.cam.position.lerp(TARGET.obj.position, CameraSettings.traveling.easing);
                if(this.unlocking) {
                    this.dofPower = MathUtils.lerp(this.dofPower, 0, .016);
                    const dist = this.measureSCDiff(sphericalCoords, prevSC);
                    if(dist === this.prevDistance) {
                        this.killTweens();
                        this.mode = CameraMode.ORBIT;
                        this.unlocking = false;
                    }
                    this.prevDistance = dist;
                }
            }
            this.cam.lookAt(origin);
            if(!this.unlocking) this.dofPower = MathUtils.lerp(this.dofPower, this.currentTarget?.closeUp ? 1 : 0, .016);
        }

        /* this.cam['aperture'] = MathUtils.lerp(this.cam['aperture'] , this.aperture, .16);
        this.cam['focalDistance'] = MathUtils.lerp(this.cam['focalDistance'], this.focalDistance, .16); */
    }
}

export const CameraManager = new CameraController();