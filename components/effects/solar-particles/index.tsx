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
  LinearSRGBColorSpace,
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

/**
 * Fallback colour for objects whose category has no Craft entry.
 *
 * Left colour-managed, unlike the category colours below, because the legacy
 * converts this one explicitly -- `new Color(0x999999).convertSRGBToLinear()`
 * -- and so arrives at the same value either way.
 */
export const UNCATEGORISED_COLOR = new Color(0x999999);

/**
 * Why the category colours are read as linear rather than converted.
 *
 * Production's particles are lighter and pinker than this port's, which were
 * darker and redder, and the difference is a colour-space one. Measured off
 * screenshots of both, over a matched window: particle density is near
 * identical, 11.8% of pixels against 10.6%, so it is not size or count --
 * but production carries 1.7x the mean luminance, and the core colours part
 * company on blue.
 *
 * Working the asteroid pink `#ff6eb4` through the shader both ways settles
 * it. Desaturate by 0.5, scale by 0.4, encode:
 *
 *   converted to linear first    vColor (1.0, 0.156, 0.456)  ->  (146,  97, 118)
 *   used as-is                   vColor (1.0, 0.431, 0.706)  ->  (155, 127, 141)
 *   measured, production                                         (148, 121, 141)
 *   measured, this port                                          (129, 101, 101)
 *
 * Blue decides it: 141 measured against 141 predicted un-managed and 118
 * predicted managed.
 *
 * Production is not colour-managing these. Almost certainly it is built
 * against a three older than r152, where `ColorManagement.enabled` defaulted
 * to false and `new Color('#ff6eb4')` kept the sRGB numbers for the shader to
 * consume as linear. The legacy source now pins ^0.174.0, where the default
 * is true -- so a rebuild of the legacy today would look like this port did,
 * not like the site it deploys.
 *
 * Which means the port was the colour-correct one and production is the
 * accident. But production is the thing people know, so it is what gets
 * matched -- deliberately, and only here. The orbit paths take the same
 * route through `new Color()` and are still managed; they are desaturated by
 * 95% so the hue barely shows, but they are the obvious next candidate if
 * this is wanted scene-wide.
 */

/**
 * On-screen particle radius, in CSS pixels. The legacy value, confirmed
 * against the deployed bundle, which ships `fixedSize: { value: 1 }`.
 *
 * This was briefly 1.4. The reasoning then was that production's particles
 * covered 1.9x the pixel area for the same peak brightness, so the port's
 * were too small -- and the arithmetic was right but the conclusion was not.
 * The area gap was the colour bug below: un-managed colours are brighter, so
 * more of each particle clears any threshold you measure against, which reads
 * as a bigger dot. Fixing the colours removed the reason for the size.
 *
 * Left at the legacy value rather than carrying two deviations that were only
 * ever compensating for one bug.
 */
const PARTICLE_PIXEL_SIZE = 1;

/**
 * Distance band over which a particle fades out, in scene units.
 *
 * These are `NEAR` and `FAR` from `gfx/OrbitViewer.ts`, which despite the
 * names are nothing to do with the camera's clip planes (those are 0.01 and
 * ~8,000,000). They are the scene's fog, and the particle shader reads them
 * through `GLOBALS.fog` to decide how much of the field to show:
 *
 *   depth = smoothstep(near, far, distanceToCamera)
 *   alpha = 1 - depth
 *
 * The port had been passing the camera's clip planes instead, which makes the
 * smoothstep a no-op: every particle came back at full alpha no matter how far
 * away it was. The visible result was not a brighter field but a flatter one.
 * Objects out at 50, 200, 500 AU -- the great majority of the dataset, and the
 * ones the legacy fades to nothing -- were painted at the same strength as the
 * main belt, spreading a uniform haze of single-pixel dots across the whole
 * frame. Against that, the belt itself stopped reading as a belt.
 */
const FADE_DISTANCE = { near: 5_000, far: 100_000 };

/**
 * Seconds the field takes to reach its full depth on arrival.
 *
 * Ported from `OrbitViewer.fadeIn()`, which eased `fog.far` from `NEAR` up to
 * `FAR` when the viewer entered landing mode. Starting with the two equal
 * makes the smoothstep saturate, so only what is nearer than `near` is drawn
 * and the system fills in from the camera outwards.
 */
const FADE_IN_SECONDS = 5;

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
      (hex
        ? color.setStyle(hex, LinearSRGBColorSpace)
        : color.copy(UNCATEGORISED_COLOR)
      ).toArray(instanceColors.array as Float32Array, i * 3);
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

  // A new material starts the arrival over: it begins at near === far.
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

  /**
   * Priority -1 so the simulation pass writes its render target before R3F
   * renders the main scene, which samples that texture in the same frame.
   *
   * The same pass eases the far plane of the depth fade open, so the field
   * arrives from the camera outwards rather than all at once.
   */
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
