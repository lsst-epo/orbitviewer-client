import { Object3D, PerspectiveCamera } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CONTROLS } from "./Globals";

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
        easing: .06
    }
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
        this.controls.minDistance = s.min;
        this.controls.maxDistance = s.max;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = s.damping;
        this.controls.zoomSpeed = s.zoomSpeed;
    }

    goToTarget(target:Object3D, distance:number=1) {
        if(!this.initialized) return console.warn("CameraController not initialized! Please run CameraManager.init() first.");
    }

    update() {
        if(!this.initialized) return;
        this.controls.enabled = this.mode === CameraMode.ORBIT;
        this.controls.update();
    }
}

export const CameraManager = new CameraController();