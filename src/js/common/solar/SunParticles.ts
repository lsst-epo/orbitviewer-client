import { AdditiveBlending, Color, Mesh, ShaderMaterial, SphereGeometry } from "three";

import frag from '../../../glsl/lib/sun_particles/sunp.frag';
import vert from '../../../glsl/lib/sun_particles/sunp.vert';

const MAX = 1024;

const SEED = new SphereGeometry(1, 32, 32);

export const P_MAT = new ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
        amp: {
            value: 100
        },
        time: {
            value: 0
        },
        fresnelColor: {
            value: new Color(0xffffff)
        },
        fresnelWidth: {
            value: .99
        },
        glowStrength: {
            value: 2
        },
        highlighted: {
            value: 0
        }
    },
    // visible: false,
    transparent: true,
    // alphaTest: .01,
    blending: AdditiveBlending,
    depthTest: true
});

export class SunParticles {
    // points:Points;
    mesh:Mesh;

    constructor(radius:number, amplitude:number) {
        P_MAT.uniforms.amp.value = amplitude;

        const mesh = new Mesh(
            SEED,
            P_MAT
        );

        mesh.scale.setScalar(1.1);
        this.mesh = mesh;
    }

    update(time:number) {
        P_MAT.uniforms.time.value = time;
        this.mesh.rotation.y = time * .015;
        this.mesh.rotation.x = time * .026;
        this.mesh.rotation.z = -time * .014;
    }
}