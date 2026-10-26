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
import { matchesFilters } from "@/lib/solar/filters";
import { GPU_SIM_SIZES, type SimQuality } from "@/lib/solar/quality";
import { useSolarClock } from "@/contexts/SolarClock";
import { GPUSim } from "./gpuSim";
import vertexShader from "./particles_instanced.vert";
import fragmentShader from "./particles_instanced.frag";

/** Fallback colour for an object whose category Craft does not colour. */
export const UNCATEGORISED_COLOR = new Color(0x999999);

/**
 * On-screen particle radius in CSS pixels, and the legacy's value. Do not
 * raise it to compensate for apparent dimness -- see README.
 */
const PARTICLE_PIXEL_SIZE = 1;

/**
 * The scene's fog band, not the camera's clip planes -- see README. Passing
 * the clip planes makes the smoothstep a no-op and flattens the field.
 */
const FADE_DISTANCE = { near: 5_000, far: 100_000 };

/** Arrival fade, from `OrbitViewer.fadeIn()`. */
export const FADE_IN_SECONDS = 5;

/** gsap's `cubic.inOut`, which is what the legacy eased the fade with. */
const cubicInOut = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

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
  /** Seconds into the arrival fade. */
  const fadeElapsed = useRef(0);
  const renderer = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const { getMJD } = useSolarClock();

  const { width, height } = GPU_SIM_SIZES[quality];
  const capacity = width * height;

  /** Created inside the effect that disposes it, never a useMemo -- README. */
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
              near: { value: FADE_DISTANCE.near },
              far: { value: FADE_DISTANCE.far },
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
   * Instance lookup coordinates. The loop order must match the simulation's
   * vertex grid exactly, or instances read another object's position.
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

  /** Must exist before the material first compiles -- see README. */
  const instanceColors = useMemo(
    () => new InstancedBufferAttribute(new Float32Array(capacity * 3), 3),
    [capacity]
  );

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !sim) return;

    sim.setData(elements);

    const count = Math.min(capacity, elements.length);
    const color = new Color();

    for (let i = 0; i < count; i++) {
      const hex = categoryColors.get(elements[i].category);
      // Colour-managed, like every other colour in the scene -- see README,
      // which this reverses.
      (hex ? color.setStyle(hex) : color.copy(UNCATEGORISED_COLOR)).toArray(
        instanceColors.array as Float32Array,
        i * 3
      );
    }

    instanceColors.needsUpdate = true;
    mesh.count = count;
  }, [sim, elements, capacity, categoryColors, instanceColors]);

  useEffect(() => {
    const array = filterValues.array as Float32Array;
    const count = Math.min(capacity, elements.length);

    for (let i = 0; i < count; i++) {
      array[i] = matchesFilters(elements[i], {
        categories: visibleCategories,
        distance: distanceRange,
        rubinOnly,
      })
        ? 1
        : 0;
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
    fadeElapsed.current = 0;
    material.uniforms.far.value = FADE_DISTANCE.near;
  }, [material]);

  useEffect(() => {
    if (!material) return;
    material.uniforms.opacity.value = dimmed
      ? OBJECT_MODE_OPACITY
      : DEFAULT_OPACITY;
  }, [material, dimmed]);

  useFrame((_, delta) => {
    sim?.render(getMJD());

    if (!material || fadeElapsed.current >= FADE_IN_SECONDS) return;

    fadeElapsed.current = Math.min(
      fadeElapsed.current + delta,
      FADE_IN_SECONDS
    );

    const t = cubicInOut(fadeElapsed.current / FADE_IN_SECONDS);
    material.uniforms.far.value =
      FADE_DISTANCE.near + (FADE_DISTANCE.far - FADE_DISTANCE.near) * t;
  }, -1);

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
