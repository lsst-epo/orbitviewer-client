"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CatmullRomCurve3,
  Color,
  InstancedBufferAttribute,
  SphereGeometry,
  Vector3,
  type ShaderMaterial,
} from "three";
import { composeShader } from "@/lib/shaders";
import vertex from "./smf.vert";
import fragment from "./smf.frag";

/** Seeded field loops replace @fils random/point utilities. The fire pass alone
 * renders these instanced fragments, preserving the original shader motion.
 */
export function SunMagneticField() {
  const material = useRef<ShaderMaterial>(null);
  const geometry = useMemo(() => {
    let seed = 731;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const point = () => {
      const z = random() * 2 - 1;
      const angle = random() * Math.PI * 2;
      const radius = Math.sqrt(1 - z * z);
      return new Vector3(radius * Math.cos(angle), z, radius * Math.sin(angle));
    };
    const positions: number[] = [];
    for (let index = 0; index < 128; index++) {
      const start = point();
      const end = point();
      const length = 0.05 + random() * 0.05;
      const first = start.clone().multiplyScalar(1 + length);
      const last = end.clone().multiplyScalar(1 + length);
      const middle = first
        .clone()
        .lerp(last, 0.5)
        .add(start.clone().multiplyScalar(length))
        .add(end.clone().multiplyScalar(length));
      const curve = new CatmullRomCurve3([start, first, middle, last, end]);
      curve
        .getPoints(3)
        .forEach((position) => positions.push(...position.toArray()));
    }
    const geo = new SphereGeometry(0.00000000001, 8, 8);
    geo.setAttribute(
      "iPos",
      new InstancedBufferAttribute(new Float32Array(positions), 3),
    );
    return geo;
  }, []);
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      color1: { value: new Color(0xf4c6a1) },
      color2: { value: new Color(0xc76537) },
      fresnelWidth: { value: 1 },
      brightness: { value: 4.3 },
    }),
    [],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }) => {
    if (material.current)
      material.current.uniforms.time.value = clock.elapsedTime;
  });
  return (
    <instancedMesh
      args={[geometry, undefined, 512]}
      scale={0.12}
      frustumCulled={false}
      userData={{ firePass: true }}
    >
      <shaderMaterial
        ref={material}
        vertexShader={composeShader(vertex)}
        fragmentShader={composeShader(fragment)}
        uniforms={uniforms}
        transparent
      />
    </instancedMesh>
  );
}
