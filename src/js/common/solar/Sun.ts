import { Mesh, Object3D, SphereGeometry } from "three";
import { SunMaterial } from "../gfx/SunMaterial";
import { KM2AU, SUN_RADIUS } from "./SolarSystem";
import { SunParticles } from "./SunParticles";

const GEO = new SphereGeometry(1, 32, 32);

/**
 * GFX Asset for the Sun
 */
export class Sun extends Object3D {
    mesh:Mesh;
    particles:SunParticles;

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
        this.add(this.particles.mesh);
    }

    update(time:number) {
        const sunMat = this.mesh.material as SunMaterial;
        sunMat.update(time);
        this.particles.update(time);
    }
}