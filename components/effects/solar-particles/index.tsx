"use client";
import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, type Intersection, type Points } from "three";
import type { OrbitRecord } from "@/lib/api/hasura";
import { objectId, orbitPosition } from "@/lib/solar/orbits";
import { categoryColor } from "@/lib/solar/categories";
import { useExplorer } from "@/contexts/ExplorerProvider";
import { composeShader } from "@/lib/shaders";
import { createSimulation } from "./simulation";
import vertex from "./shaders/particles.vert";
import fragment from "./shaders/particles.frag";

function colorsFor(records: OrbitRecord[]) {
  const colors = new Float32Array(records.length * 3);
  records.forEach((record, index) =>
    new Color(categoryColor(record.object_type)).toArray(colors, index * 3),
  );
  return colors;
}

/** The FBO advances every orbit on the GPU; React only updates its date uniform.
 * CPU orbital calculations are reserved for picking and unsupported devices.
 */
function GPUParticles({ records }: { records: OrbitRecord[] }) {
  const { mjd, select, selectedId } = useExplorer();
  const simulation = useMemo(() => createSimulation(records), [records]);
  const colors = useMemo(() => colorsFor(records), [records]);
  const positions = useMemo(
    () => new Float32Array(records.length * 3),
    [records],
  );
  const uniforms = useMemo(
    () => ({
      computedPosition: { value: simulation.target.texture },
      opacity: { value: 0.1 },
    }),
    [simulation],
  );
  useEffect(() => () => simulation.dispose(), [simulation]);
  useFrame(({ gl }) => {
    // Three uniforms are intentionally mutable outside React rendering.
    simulation.material.uniforms.d.value = mjd;
    uniforms.opacity.value = selectedId ? 0.025 : 0.1;
    const previous = gl.getRenderTarget();
    gl.setRenderTarget(simulation.target);
    gl.render(simulation.scene, simulation.camera);
    gl.setRenderTarget(previous);
  }, -2);
  return (
    <points
      scale={0.001}
      frustumCulled={false}
      raycast={function (this: Points, raycaster, intersections) {
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
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-simUV" args={[simulation.uv, 2]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={composeShader(vertex)}
        fragmentShader={composeShader(fragment).replace(
          "#include <colorspace_pars_fragment>",
          "",
        )}
        uniforms={uniforms}
        vertexColors
        transparent
        depthWrite={false}
      />
    </points>
  );
}

function CPUParticles({ records }: { records: OrbitRecord[] }) {
  const { mjd, select } = useExplorer();
  const positions = useMemo(() => {
    const array = new Float32Array(records.length * 3);
    records.forEach((record, index) =>
      orbitPosition(record, mjd).toArray(array, index * 3),
    );
    return array;
  }, [records, mjd]);
  const colors = useMemo(() => colorsFor(records), [records]);
  return (
    <points
      onClick={(event) => {
        if (event.index !== undefined && records[event.index]) {
          event.stopPropagation();
          select(objectId(records[event.index]));
        }
      }}
    >
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={0.55}
      />
    </points>
  );
}
export function SolarParticles({ records }: { records: OrbitRecord[] }) {
  const gl = useThree((state) => state.gl);
  return gl.extensions.has("EXT_color_buffer_float") ? (
    <GPUParticles records={records} />
  ) : (
    <CPUParticles records={records} />
  );
}
