import { copy } from "fs-extra";
import { Object3D, PerspectiveCamera, Quaternion, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { InteractiveObject } from "../../production/ui/expandable-items/Raycaster";
import { CONTROLS, DEV } from "./Globals";

import { gsap } from "gsap/gsap-core";

export const DEFAULT_CAM_POS:Vector3 = new Vector3 (0,3,10);

export enum CameraMode {
    ORBIT,
    LOCKED,
    DISABLED
}

export const CameraSettings = {
    orbit: {
        min: 0.05,
        max: 600,
        damping: .1,
        zoomSpeed: 1.2
    },
    traveling: {
        easing: .016
    }
}

const TARGET = {
    obj: new Object3D(),
    prevPos: new Vector3(),
    prevRot: new Quaternion()
}

const origin = new Vector3();
const tmp = new Vector3();
const tmp2 = new Vector3();

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
    }

    goToTarget(target:InteractiveObject, orbitAround:boolean=false) {
        if(!this.initialized) return console.warn("CameraController not initialized! Please run CameraManager.init() first.");
        this.killTweens();
        this.mode = CameraMode.LOCKED;
        target.target.getWorldPosition(TARGET.obj.position);
        tmp.copy(TARGET.obj.position);
        tmp2.copy(origin).sub(tmp).normalize().multiplyScalar(target.lockedDistance);
        TARGET.obj.position.sub(tmp2)
        TARGET.obj.translateX(target.lockedOffset.x);
        TARGET.obj.translateY(target.lockedOffset.y);
        TARGET.obj.translateZ(target.lockedOffset.z);
        TARGET.obj.lookAt(origin);
        TARGET.prevPos.copy(this.cam.position);
        TARGET.prevRot.copy(this.cam.quaternion);
        this.orbit = orbitAround;
        this.currentTarget = target;
    }

    private killTweens() {
        gsap.killTweensOf(this.cam.position);
        gsap.killTweensOf(this.cam.quaternion);
    }

    unlock() {
        if(!this.initialized) return console.warn("CameraController not initialized! Please run CameraManager.init() first.");
        this.mode = CameraMode.DISABLED;
        this.killTweens();
        this.orbit = false;

        const pos = TARGET.prevPos;
        const quat = TARGET.prevRot;

        gsap.to(this.cam.position, {x: pos.x, y: pos.y, z: pos.z, duration: 3, ease: 'power2.inOut', onUpdate:() => {
            this.cam.lookAt(origin);
        }, onComplete: () => {
            this.mode = CameraMode.ORBIT;
            this.killTweens();
        }});
        // gsap.to(this.cam.quaternion, {x: quat.x, y: quat.y, z: quat.z, w: quat.w, duration: 3, ease: 'power2.inOut'});
    }

    reset() {
        if(!this.initialized) return console.warn("CameraController not initialized! Please run CameraManager.init() first.");
        TARGET.prevPos.copy(DEFAULT_CAM_POS);
        TARGET.prevRot.set(0,0,0,1);
        this.unlock();
    }

    update() {
        if(!this.initialized) return;
        this.controls.enabled = this.mode === CameraMode.ORBIT;
        if(this.controls.enabled) this.controls.update();
        if(this.mode === CameraMode.LOCKED) {
            if(this.orbit) {
                const t = performance.now() * .001 * .025;
                tmp.copy(this.currentTarget.target.position);
                tmp.x += this.currentTarget.lockedDistance * Math.cos(t);
                tmp.z += this.currentTarget.lockedDistance * Math.sin(t);
                tmp.y += .25 * Math.sin(t * 1.5);
                this.cam.position.lerp(tmp, CameraSettings.traveling.easing);
                this.cam.lookAt(this.currentTarget.target.position);
            } else {
                this.cam.position.lerp(TARGET.obj.position, CameraSettings.traveling.easing);
                this.cam.lookAt(origin);
            }
        }
    }
}

export const CameraManager = new CameraController();