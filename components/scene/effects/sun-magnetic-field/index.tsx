"use client";

import { useEffect, useMemo, useRef, type FunctionComponent } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  InstancedBufferAttribute,
  InstancedMesh,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { Random } from "@/lib/math";
import { FIRE_LAYER } from "@/components/scene/effects/composite/layers";
import vertexShader from "./smf.vert";
import fragmentShader from "./smf.frag";

const LINE_COUNT = 128;
const SEGMENTS_PER_LINE = 4;

/** Radius of one instance. Effectively a point; the look comes from the blur. */
const INSTANCE_RADIUS = 1e-11;

/** Arc bow height, as a fraction of the sun's radius. */
const ARC_HEIGHT = { min: 0.05, max: 0.1 };

export interface SunMagneticFieldProps {
  /** Surface to anchor the field lines to. Defaults to the sun's own sphere. */
  surface?: BufferGeometry;
}

const SunMagneticField: FunctionComponent<SunMagneticFieldProps> = ({
  surface,
}) => {
  const meshRef = useRef<InstancedMesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);

  const { positions, count } = useMemo(() => {
    const geometry = surface ?? new SphereGeometry(1, 64, 32);
    const vertices = geometry.attributes.position.array as Float32Array;
    const normals = geometry.attributes.normal.array as Float32Array;
    const vertexCount = geometry.attributes.position.count;

    const random = new Random();
    const samples: Array<number> = [];

    const vertexAt = (index: number) =>
      new Vector3(
        vertices[index * 3],
        vertices[index * 3 + 1],
        vertices[index * 3 + 2]
      );

    const normalAt = (index: number) =>
      new Vector3(
        normals[index * 3],
        normals[index * 3 + 1],
        normals[index * 3 + 2]
      );

    for (let i = 0; i < LINE_COUNT; i++) {
      const a = random.int(0, vertexCount - 1);
      const b = random.int(0, vertexCount - 1);

      const start = vertexAt(a);
      const end = vertexAt(b);
      const height = random.float(ARC_HEIGHT.min, ARC_HEIGHT.max);

      const startNormal = normalAt(a);
      const endNormal = normalAt(b);

      const startControl = start
        .clone()
        .add(startNormal.clone().multiplyScalar(height));
      const endControl = end
        .clone()
        .add(endNormal.clone().multiplyScalar(height));

      const midpoint = startControl
        .clone()
        .add(endControl.clone().sub(startControl).multiplyScalar(0.5))
        .add(startNormal)
        .add(endNormal);

      const path = new CatmullRomCurve3([
        start,
        startControl,
        midpoint,
        endControl,
        end,
      ]);

      for (const point of path.getPoints(SEGMENTS_PER_LINE - 1)) {
        samples.push(point.x, point.y, point.z);
      }
    }

    // The geometry is disposed only if we created it here.
    if (!surface) geometry.dispose();

    return { positions: new Float32Array(samples), count: samples.length / 3 };
  }, [surface]);

  const instancePositions = useMemo(
    () => new InstancedBufferAttribute(positions, 3),
    [positions]
  );

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      color1: { value: new Color(0xf4c6a1) },
      color2: { value: new Color(0xc76537) },
      fresnelWidth: { value: 1 },
      brightness: { value: 4.3 },
    }),
    []
  );

  useEffect(() => {
    // Drawn only by the compositor's fire pass.
    meshRef.current?.layers.set(FIRE_LAYER);
  }, []);

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.time.value = state.clock.elapsedTime;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <sphereGeometry args={[INSTANCE_RADIUS, 8, 8]}>
        <primitive object={instancePositions} attach="attributes-iPos" />
      </sphereGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </instancedMesh>
  );
};

export default SunMagneticField;
