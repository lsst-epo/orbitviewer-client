import { MathUtils } from "@jocabola/math";
import { gsap } from "gsap/gsap-core";
import { Mesh, Object3D, SphereGeometry, Vector3 } from "three";
import { InteractiveObject } from "../../production/ui/popups/Raycaster";
import { SunMaterial } from "../gfx/SunMaterial";
import { PLANET_SCALE } from "./Planet";
import { KM2AU, SUN_RADIUS } from "./SolarSystem";
import { SunParticles } from "./SunParticles";

const GEO = new SphereGeometry(1, 32, 32);

export const SUN_SCALE = {
    min: SUN_RADIUS * KM2AU,
    max: SUN_RADIUS * KM2AU * PLANET_SCALE * .2
}

/**
 * GFX Asset for the Sun
 */
export class Sun extends Object3D implements InteractiveObject {
    mesh:Mesh;
    particles:SunParticles;
    selected:boolean = false;
    target:Object3D = this;
    lockedDistance:number = .6;
    lockedOffset:Vector3 = new Vector3();

    constructor() {
        super();

        this.scale.setScalar(SUN_RADIUS * KM2AU);

        this.mesh = new Mesh(
            GEO,
            new SunMaterial({
                emissive: 0xff6600,
                emissiveIntensity: 1.5
            })
        );

        this.add(this.mesh);

        this.particles = new SunParticles(1.1, this.scale.x * .15);
        // this.add(this.particles.mesh);
    }

    set highlight(value:boolean) {
        gsap.killTweensOf(this.scale);
        const scl = value ? SUN_SCALE.max : SUN_SCALE.min;
        gsap.to(this.scale, {x: scl, y: scl, z: scl, ease: 'power2.inOut', duration: 3});
        this.selected = value;
    }

    update(time:number) {
        const t = performance.now() * .001;
        const sunMat = this.mesh.material as SunMaterial;
        sunMat.update(t, this);
        this.particles.update(t);
        if(sunMat.shaderRef) {
            sunMat.shaderRef.uniforms.vertexAmp.value = MathUtils.lerp(
                sunMat.shaderRef.uniforms.vertexAmp.value,
                this.selected ? 0.0005 : 0.00025,
                .016
            )
        }
    }
}