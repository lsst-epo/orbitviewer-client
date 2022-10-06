import { MathUtils } from "@jocabola/math";
import { Mesh, Object3D, SphereGeometry, Vector3 } from "three";
import { CameraManager } from "../core/CameraManager";
import { SunMaterial } from "../gfx/SunMaterial";
import { PLANET_SCALE } from "./Planet";
import { InteractiveObject } from "./SolarElement";
import { KM2AU, SUN_RADIUS } from "./SolarSystem";
import { P_MAT, SunParticles } from "./SunParticles";

const GEO = new SphereGeometry(1, 32, 32);

export const SUN_SCALE = {
    min: SUN_RADIUS * KM2AU * PLANET_SCALE,
    max: SUN_RADIUS * KM2AU * PLANET_SCALE
}

/**
 * GFX Asset for the Sun
 */
export class Sun extends Object3D implements InteractiveObject {
    mesh:Mesh;
    particles:SunParticles;
    selected:boolean = false;
    target:Object3D = this;
    lockedDistance:number = 4.6;
    lockedOffset:Vector3 = new Vector3()
    closeUp: boolean = true;

    constructor() {
        super();

        this.scale.setScalar(SUN_RADIUS * KM2AU * PLANET_SCALE);

        this.mesh = new Mesh(
            GEO,
            new SunMaterial({
                emissive: 0xff6600,
                emissiveIntensity: 1.5
            })
        );

        this.add(this.mesh);

        this.particles = new SunParticles(1.1, this.scale.x * .15);
        this.add(this.particles.mesh);
    }

    set highlight(value:boolean) {
        /* gsap.killTweensOf(this.scale);
        const scl = value ? SUN_SCALE.max : SUN_SCALE.min;
        gsap.to(this.scale, {x: scl, y: scl, z: scl, ease: 'power2.inOut', duration: 3}); */
        this.selected = value;
    }

    update(time:number) {
        const t = performance.now() * .001;
        const sunMat = this.mesh.material as SunMaterial;
        sunMat.update(t, this);
        this.particles.update(t);
        if(sunMat.shaderRef) {
            /* sunMat.shaderRef.uniforms.vertexAmp.value = MathUtils.lerp(
                sunMat.shaderRef.uniforms.vertexAmp.value,
                this.selected ? 0.0005 : 0.00025,
                .016
            ) */
            sunMat.shaderRef.uniforms.fresnelWidth.value = MathUtils.lerp(
                sunMat.shaderRef.uniforms.fresnelWidth.value,
                this.selected ? 0.8 : 0.5,
                .016
            );

            sunMat.shaderRef.uniforms.glowStrength.value = MathUtils.lerp(
                sunMat.shaderRef.uniforms.fresnelWidth.value,
                this.selected ? 5 : 3,
                .016
            );
        }
        if(!CameraManager.active) return;
        const camPos = CameraManager.cam.position;

        const sel = this.selected;

        const cd = MathUtils.smoothstep(100, 1000, camPos.length());
        sunMat.emissiveIntensity = MathUtils.lerp(sunMat.emissiveIntensity, sel ? MathUtils.lerp(1.8, 100, cd) : 1.6, .016);
        const scl = SUN_RADIUS * KM2AU * PLANET_SCALE * MathUtils.lerp(1, sel ? 10 : 5, cd);
        const s = MathUtils.lerp(this.scale.x, scl, .016);
        this.scale.setScalar(scl);
        let pscl = MathUtils.lerp(
            this.particles.mesh.scale.x,
            sel ? MathUtils.lerp(1.6,5.6,cd) : 1.1,
            .16
        );
        this.particles.mesh.scale.setScalar(pscl);
        P_MAT.uniforms.glowStrength.value = MathUtils.lerp(
            P_MAT.uniforms.glowStrength.value,
            sel ? 5 : 3,
            .016
        );
        P_MAT.uniforms.highlighted.value = MathUtils.lerp(
            P_MAT.uniforms.highlighted.value,
            sel ? 1 : 0,
            .016
        );
    }
}