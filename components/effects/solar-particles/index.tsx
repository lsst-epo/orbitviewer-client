"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FunctionComponent,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Color,
  InstancedBufferAttribute,
  InstancedMesh,
  ShaderMaterial,
  Vector2,
} from "three";
import type { OrbitElements, SolarCategory } from "@/lib/solar/types";
import { GPU_SIM_SIZES, type SimQuality } from "@/lib/solar/quality";
import { useSolarClock } from "@/contexts/SolarClock";
import { CAMERA_CLIP } from "@/components/celestial-bodies/camera";
import { GPUSim } from "./gpuSim";
import vertexShader from "./particles_instanced.vert";
import fragmentShader from "./particles_instanced.frag";

/**
 * The field of minor bodies.
 *
 * Ported from `gfx/solar/SolarParticles.ts`. One instanced low-poly sphere per
 * object; the vertex shader reads each instance's position out of the GPU
 * simulation texture rather than from an instance matrix, so moving hundreds
 * of thousands of objects costs one render-target pass instead of hundreds of
 * thousands of matrix writes.
 *
 * Instances are laid out in the same row-major order as the simulation texels,
 * and `simUV` carries the lookup coordinate.
 */

/** Fallback colour for objects whose category has no Craft entry. */
export const UNCATEGORISED_COLOR = new Color(0x999999);

/**
 * On-screen particle diameter, in pixels. This is the legacy value.
 *
 * The field looked invisible during development, which initially seemed to
 * call for a larger value to compensate for the unported glow/bloom pass
 * (`gfx/core/RubinRenderer.ts`). That was a misdiagnosis: the real cause was
 * the simulation being disposed on StrictMode remount, so nothing was
 * propagating at all. With that fixed, 1px reads correctly -- and better than
 * an enlarged value, which renders the belt chunky and oversaturated.
 */
const PARTICLE_PIXEL_SIZE = 1;

const DEFAULT_OPACITY = 1;
/** Dimmed opacity while a single object is being inspected. */
export const OBJECT_MODE_OPACITY = 0.1;

export interface SolarParticlesProps {
  elements: Array<OrbitElements>;
  quality: SimQuality;
  /** Category slug to hex colour, from Craft's objectTypes group. */
  categoryColors: Map<string, string>;
  /** Categories currently switched on. Others fade out. */
  visibleCategories?: Set<SolarCategory>;
  /** Semi-major axis range filter, in AU. */
  distanceRange?: { min: number; max: number };
  /** undefined = no filter, true = Rubin discoveries only, false = exclude. */
  rubinOnly?: boolean;
  /** Dims the field when an object is selected. */
  dimmed?: boolean;
}

const SolarParticles: FunctionComponent<SolarParticlesProps> = ({
  elements,
  quality,
  categoryColors,
  visibleCategories,
  distanceRange,
  rubinOnly,
  dimmed = false,
}) => {
  const meshRef = useRef<InstancedMesh>(null);
  const renderer = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const { getMJD } = useSolarClock();

  const { width, height } = GPU_SIM_SIZES[quality];
  const capacity = width * height;

  /**
   * The simulation owns GPU resources, so it is created *inside* the effect
   * that disposes it -- never in a useMemo.
   *
   * useMemo + dispose-in-effect-cleanup is a trap here: React StrictMode
   * mounts, unmounts and remounts in development, which runs the cleanup
   * (disposing the render target and clearing the sim scene) while useMemo
   * keeps handing back the same, now-dead instance. The result is a sim that
   * ticks every frame against an empty scene and writes nothing -- every
   * particle then reads position (0,0,0) and the entire field collapses onto
   * the sun. Creating it in the effect guarantees the remount builds a fresh
   * one.
   */
  const [sim, setSim] = useState<GPUSim | null>(null);

  useEffect(() => {
    const instance = new GPUSim({ renderer, quality });
    setSim(instance);

    return () => {
      instance.dispose();
      setSim((current) => (current === instance ? null : current));
    };
  }, [renderer, quality]);

  const material = useMemo(
    () =>
      !sim
        ? null
        : new ShaderMaterial({
            vertexShader,
            fragmentShader,
            transparent: true,
            uniforms: {
              computedPosition: { value: sim.texture },
              opacity: { value: DEFAULT_OPACITY },
              near: { value: CAMERA_CLIP.near },
              far: { value: CAMERA_CLIP.far },
              fixedSize: { value: PARTICLE_PIXEL_SIZE },
              resolution: { value: new Vector2() },
              isGlow: { value: false },
              hasGlow: { value: false },
            },
          }),
    [sim]
  );

  useEffect(() => () => material?.dispose(), [material]);

  /**
   * Instance lookup coordinates. Built once per tier -- the loop order must
   * match the simulation's vertex grid exactly, or instances read another
   * object's position.
   */
  const simUV = useMemo(() => {
    const uv = new Float32Array(capacity * 2);
    let p = 0;
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        uv[p++] = i / (width - 1);
        uv[p++] = j / (height - 1);
      }
    }
    return new InstancedBufferAttribute(uv, 2);
  }, [capacity, width, height]);

  const filterValues = useMemo(
    () => new InstancedBufferAttribute(new Float32Array(capacity).fill(1), 1),
    [capacity]
  );

  /**
   * Per-instance colours, allocated up front and attached declaratively.
   *
   * This must exist before the material first compiles. three only declares
   * `attribute vec3 instanceColor` when USE_INSTANCING_COLOR is set, and it
   * derives that from `mesh.instanceColor !== null` at compile time. Relying
   * on InstancedMesh.setColorAt() to allocate it from an effect is too late:
   * the program compiles on the first render and fails with "'instanceColor'
   * : undeclared identifier", after which nothing in the field draws.
   */
  const instanceColors = useMemo(
    () => new InstancedBufferAttribute(new Float32Array(capacity * 3), 3),
    [capacity]
  );

  // Upload elements to the simulation and colour each instance by category.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !sim) return;

    sim.setData(elements);

    const count = Math.min(capacity, elements.length);
    const color = new Color();

    for (let i = 0; i < count; i++) {
      const hex = categoryColors.get(elements[i].category);
      // Color.set() applies the sRGB -> linear conversion; toArray copies the
      // already-converted components straight into the instance buffer.
      (hex ? color.set(hex) : color.copy(UNCATEGORISED_COLOR)).toArray(
        instanceColors.array as Float32Array,
        i * 3
      );
    }

    instanceColors.needsUpdate = true;
    mesh.count = count;
  }, [sim, elements, capacity, categoryColors, instanceColors]);

  /**
   * Filtering dims rather than removes: writing 0 into `filterValue` fades the
   * instance out in the fragment shader, which keeps the instance buffer
   * stable and avoids reuploading geometry on every filter change.
   */
  useEffect(() => {
    const array = filterValues.array as Float32Array;
    const count = Math.min(capacity, elements.length);

    for (let i = 0; i < count; i++) {
      const el = elements[i];

      const categoryOk =
        !visibleCategories || visibleCategories.has(el.category);
      const distanceOk =
        !distanceRange ||
        (el.a >= distanceRange.min && el.a <= distanceRange.max);
      const discoveryOk =
        rubinOnly === undefined || el.rubinDiscovery === rubinOnly;

      array[i] = categoryOk && distanceOk && discoveryOk ? 1 : 0;
    }

    filterValues.needsUpdate = true;
  }, [
    filterValues,
    elements,
    capacity,
    visibleCategories,
    distanceRange,
    rubinOnly,
  ]);

  useEffect(() => {
    material?.uniforms.resolution.value.set(size.width, size.height);
  }, [material, size.width, size.height]);

  useEffect(() => {
    if (!material) return;
    material.uniforms.opacity.value = dimmed
      ? OBJECT_MODE_OPACITY
      : DEFAULT_OPACITY;
  }, [material, dimmed]);

  /**
   * Priority -1 so the simulation pass writes its render target before R3F
   * renders the main scene, which samples that texture in the same frame.
   */
  useFrame(() => sim?.render(getMJD()), -1);

  // The mesh cannot exist before the simulation it samples from.
  if (!sim || !material) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, capacity]}
      material={material}
      // Instances are positioned in the shader, so their bounding volume is
      // meaningless to three and culling would remove the whole field.
      frustumCulled={false}
    >
      <primitive object={instanceColors} attach="instanceColor" />
      <sphereGeometry args={[1, 4, 4]}>
        <primitive object={simUV} attach="attributes-simUV" />
        <primitive object={filterValues} attach="attributes-filterValue" />
      </sphereGeometry>
    </instancedMesh>
  );
};

export default SolarParticles;
