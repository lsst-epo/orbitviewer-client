"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Color, type ShaderMaterial } from "three";
import vertex from "./sun.vert";
import fragment from "./sun.frag";
import { composeShader } from "@/lib/shaders";
import { SunMagneticField } from "@/components/effects/sun-magnetic-field";
import { ObjectLabel } from "@/components/molecules/ObjectLabel";
import { useExplorer } from "@/contexts/ExplorerProvider";

/** Legacy Sun surface with unchanged GLSL and shared include composition. */
export function Sun() {
  const { entries, categoryPalette, selectedId, select } = useExplorer();
  const sunName =
    entries.find((entry) => entry.elementID === "sun")?.title ?? "Sun";
  const material = useRef<ShaderMaterial>(null);
  const halo = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      color1: { value: new Color(0xf4c6a1) },
      color2: { value: new Color(0xc76537) },
      fresnelWidth: { value: 1.9 },
      brightness: { value: 1.3 },
      hasGlow: { value: true },
      isGlow: { value: false },
    }),
    [],
  );
  const haloUniforms = useMemo(
    () => ({ ...uniforms, fresnelWidth: { value: 3.8 } }),
    [uniforms],
  );
  useFrame(({ clock }) => {
    if (material.current)
      material.current.uniforms.time.value = clock.elapsedTime;
    if (halo.current) halo.current.uniforms.time.value = clock.elapsedTime;
  });
  return (
    <group>
      <mesh
        userData={{ isSun: true }}
        onClick={(event) => {
          event.stopPropagation();
          select("sun");
        }}
      >
        <sphereGeometry args={[0.12, 48, 32]} />
        <shaderMaterial
          ref={material}
          vertexShader={composeShader(vertex)}
          fragmentShader={composeShader(fragment)}
          uniforms={uniforms}
        />
      </mesh>
      <mesh scale={1.025} userData={{ firePass: true }}>
        <sphereGeometry args={[0.12, 48, 32]} />
        <shaderMaterial
          ref={halo}
          vertexShader={composeShader(vertex)}
          fragmentShader={"#define HALO\n" + composeShader(fragment)}
          uniforms={haloUniforms}
          transparent
          depthWrite={false}
        />
      </mesh>
      <SunMagneticField />
      <Html position={[0, 0, 0]} zIndexRange={[2, 0]}>
        <ObjectLabel
          name={sunName}
          types={[9]}
          palette={categoryPalette}
          selected={selectedId === "sun"}
          onSelect={() => select("sun")}
        />
      </Html>
    </group>
  );
}
