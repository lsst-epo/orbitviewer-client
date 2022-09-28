import { copy } from "fs-extra";
import { Object3D, PerspectiveCamera, Quaternion, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { InteractiveObject } from "../../production/ui/expandable-items/Raycaster";
import { CONTROLS, DEV } from "./Globals";

import { gsap } from "gsap/gsap-core";

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

    goToTarget(target:InteractiveObject) {
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
    }

    private killTweens() {
        gsap.killTweensOf(this.cam.position);
        gsap.killTweensOf(this.cam.quaternion);
    }

    unlock() {
        if(!this.initialized) return console.warn("CameraController not initialized! Please run CameraManager.init() first.");
        this.mode = CameraMode.DISABLED;
        this.killTweens();

        const pos = TARGET.prevPos;
        const quat = TARGET.prevRot;

        gsap.to(this.cam.position, {x: pos.x, y: pos.y, z: pos.z, duration: 3, ease: 'power2.inOut', onComplete: () => {
            this.mode = CameraMode.ORBIT;
            this.killTweens();
        }});
        gsap.to(this.cam.quaternion, {x: quat.x, y: quat.y, z: quat.z, w: quat.w, duration: 3, ease: 'power2.inOut'});
    }

    update() {
        if(!this.initialized) return;
        this.controls.enabled = this.mode === CameraMode.ORBIT;
        if(this.controls.enabled) this.controls.update();
        if(this.mode === CameraMode.LOCKED) {
            this.cam.position.lerp(TARGET.obj.position, CameraSettings.traveling.easing);
            // this.cam.quaternion.slerp(TARGET.obj.quaternion, CameraSettings.traveling.easing);
            this.cam.lookAt(origin);
            // this.cam.updateMatrix();
        }
    }
}

export const CameraManager = new CameraController();