"use client";

import { useEffect, useMemo, useRef, type FunctionComponent } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Mesh, MeshBasicMaterial, ShaderMaterial } from "three";
import { KM2AU, PLANET_SCALE, SUN_RADIUS } from "@/lib/solar/constants";
import { useSolarClock } from "@/contexts/SolarClock";
import SunMagneticField from "@/components/effects/sun-magnetic-field";
import { FIRE_LAYER } from "@/components/effects/composite/layers";
import vertexShader from "./sun.vert";
import fragmentShader from "./sun.frag";

/**
 * The Sun.
 *
 * Ported from `gfx/solar/Sun.ts`. Three pieces share one shader:
 *
 *  - the body, lit normally and contributing to the bloom pass;
 *  - a halo, the same shader with HALO defined, which displaces its vertices
 *    through curl noise and renders only the fresnel rim;
 *  - the magnetic field lines.
 *
 * The halo and field lines belong to the compositor's fire pass and sit on
 * FIRE_LAYER, so the main camera never draws them un-blurred. The body carries
 * the userData contract the compositor uses to swap in an occluding black
 * material for that pass -- without it the halo would show through the sun.
 */

/** Sun radius in scene units. */
export const SUN_SCENE_RADIUS = SUN_RADIUS * KM2AU * PLANET_SCALE;

/** The halo sits just proud of the surface. */
const HALO_SCALE = 1.025;

export interface SunProps {
  /** Multiplier on the physical radius, for the exaggerated overview scale. */
  scale?: number;
}

const Sun: FunctionComponent<SunProps> = ({ scale = 1 }) => {
  const bodyRef = useRef<Mesh>(null);
  const haloRef = useRef<Mesh>(null);
  const bodyMaterialRef = useRef<ShaderMaterial>(null);
  const haloMaterialRef = useRef<ShaderMaterial>(null);
  const { getSimulationTime } = useSolarClock();

  const baseUniforms = useMemo(
    () => ({
      color1: { value: new Color(0xf4c6a1) },
      color2: { value: new Color(0xc76537) },
      fresnelWidth: { value: 1.9 },
      brightness: { value: 1.3 },
      hasGlow: { value: true },
      isGlow: { value: false },
    }),
    []
  );

  const bodyUniforms = useMemo(
    () => ({ ...baseUniforms, time: { value: 0 } }),
    [baseUniforms]
  );

  const haloUniforms = useMemo(
    () => ({
      ...baseUniforms,
      time: { value: 0 },
      // The halo's rim is twice as wide as the body's.
      fresnelWidth: { value: baseUniforms.fresnelWidth.value * 2 },
    }),
    [baseUniforms]
  );

  /**
   * Opaque black stand-in used during the fire pass, so the sun's disc
   * occludes the halo behind it instead of letting it bleed through.
   */
  const blockMaterial = useMemo(
    () => new MeshBasicMaterial({ color: 0x000000 }),
    []
  );

  useEffect(() => () => blockMaterial.dispose(), [blockMaterial]);

  // The compositor discovers these through userData rather than by reference,
  // which keeps it independent of how the sun is assembled.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    body.userData.isSun = true;
    body.userData.blockMaterial = blockMaterial;
    body.userData.defaultMaterial = body.material;
    // Present in both passes: lit normally, black during the fire pass.
    body.layers.enable(FIRE_LAYER);
  }, [blockMaterial]);

  useEffect(() => {
    haloRef.current?.layers.set(FIRE_LAYER);
  }, []);

  useFrame(() => {
    // Surface detail animates against simulation time, so scrubbing the clock
    // scrubs the granulation with it. Relative to the clock's origin, not the
    // epoch -- see getSimulationTime for why that distinction matters to the
    // noise functions.
    const time = getSimulationTime();
    if (bodyMaterialRef.current) {
      bodyMaterialRef.current.uniforms.time.value = time;
    }
    if (haloMaterialRef.current) {
      haloMaterialRef.current.uniforms.time.value = time;
    }
  });

  const radius = SUN_SCENE_RADIUS * scale;

  return (
    <group scale={radius}>
      <mesh ref={bodyRef}>
        <sphereGeometry args={[1, 64, 32]} />
        <shaderMaterial
          ref={bodyMaterialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={bodyUniforms}
        />
      </mesh>

      <mesh ref={haloRef} scale={HALO_SCALE}>
        <sphereGeometry args={[1, 64, 32]} />
        <shaderMaterial
          ref={haloMaterialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={haloUniforms}
          defines={{ HALO: "" }}
          transparent
        />
      </mesh>

      <SunMagneticField />
    </group>
  );
};

export default Sun;
