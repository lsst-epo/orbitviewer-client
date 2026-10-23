"use client";
import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, Vector2, type Intersection, type InstancedMesh } from "three";
import type { OrbitRecord } from "@/lib/api/hasura";
import { objectId, orbitPosition } from "@/lib/solar/orbits";
import { categoryColor, type CategoryPalette } from "@/lib/solar/categories";
import { useExplorer } from "@/contexts/ExplorerProvider";
import { composeShader } from "@/lib/shaders";
import { createSimulation, createCPUSimulation } from "./simulation";
import vertex from "./shaders/particles_instanced.vert";
import fragment from "./shaders/particles_instanced.frag";

function colorsFor(records: OrbitRecord[], palette: CategoryPalette) {
  const colors = new Float32Array(records.length * 3);
  records.forEach((record, index) =>
    new Color(categoryColor(record.object_type, palette)).toArray(
      colors,
      index * 3,
    ),
  );
  return colors;
}

/** The FBO advances every orbit on the GPU; React only updates its date uniform.
 * CPU orbital calculations are reserved for picking and unsupported devices.
 */
export function SolarParticles({ records }: { records: OrbitRecord[] }) {
  const gl = useThree((state) => state.gl);
  const supportsFloatTargets = gl.extensions.has("EXT_color_buffer_float");
  const { mjd, select, selectedId, categoryPalette } = useExplorer();
  const simulation = useMemo(
    () =>
      supportsFloatTargets
        ? createSimulation(records)
        : createCPUSimulation(records),
    [records, supportsFloatTargets],
  );
  const colors = useMemo(
    () => colorsFor(records, categoryPalette),
    [records, categoryPalette],
  );
  const filters = useMemo(
    () => new Float32Array(records.length).fill(1),
    [records],
  );
  const uniforms = useMemo(
    () => ({
      computedPosition: { value: simulation.texture },
      opacity: { value: 1 },
      near: { value: 5 },
      far: { value: 100 },
      fixedSize: { value: 1 },
      resolution: { value: new Vector2() },
      isGlow: { value: false },
      hasGlow: { value: false },
    }),
    [simulation],
  );
  useEffect(() => () => simulation.dispose(), [simulation]);
  useFrame(({ gl, size }) => {
    // Three uniforms are intentionally mutable outside React rendering.
    simulation.update(gl, mjd);
    uniforms.opacity.value = selectedId ? 0.1 : 1;
    uniforms.resolution.value.set(size.width, size.height);
  }, -2);
  return (
    <instancedMesh
      args={[undefined, undefined, records.length]}
      frustumCulled={false}
      raycast={function (this: InstancedMesh, raycaster, intersections) {
        // GPU positions are absent from the CPU geometry. Evaluate only on input,
        // with an angular tolerance so selection works at different zoom levels.
        let nearest: Intersection | undefined;
        records.forEach((record, index) => {
          const point = orbitPosition(record, mjd);
          const distance = point.distanceTo(raycaster.ray.origin);
          if (distance < raycaster.near || distance > raycaster.far) return;
          if (
            raycaster.ray.distanceSqToPoint(point) / (distance * distance) <
              0.000015 &&
            (!nearest || distance < nearest.distance)
          ) {
            nearest = { distance, point, index, object: this };
          }
        });
        if (nearest) intersections.push(nearest);
      }}
      onClick={(event) => {
        if (event.index !== undefined && records[event.index]) {
          event.stopPropagation();
          select(objectId(records[event.index]));
        }
      }}
    >
      <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
      <sphereGeometry args={[1, 4, 4]}>
        <instancedBufferAttribute
          attach="attributes-simUV"
          args={[simulation.uv, 2]}
        />
        <instancedBufferAttribute
          attach="attributes-filterValue"
          args={[filters, 1]}
        />
      </sphereGeometry>
      <shaderMaterial
        // The original shader uses legacy units (1 AU = 1000). Convert the
        // sampled center to AU before its camera-distance/pixel-size calculation.
        vertexShader={composeShader(vertex).replace(
          "vec3 instancePosition = cP.xyz;",
          "vec3 instancePosition = cP.xyz * 0.001;",
        )}
        fragmentShader={composeShader(fragment)}
        uniforms={uniforms}
        vertexColors
        transparent
        depthWrite={false}
      />
    </instancedMesh>
  );
}
