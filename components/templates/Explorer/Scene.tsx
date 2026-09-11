"use client";

import { useMemo, type FunctionComponent } from "react";
import { useFrame } from "@react-three/fiber";
import { PLANET_SCALE } from "@/lib/solar/constants";
import { fromPlanetElements, categoryFromTypeCode } from "@/lib/solar/elements";
import { PlanetRadiusMap, isPlanetId } from "@/lib/solar/planets";
import type { PerturbationContext } from "@/lib/solar/orbits";
import type { OrbitElements } from "@/lib/solar/types";
import { useSolarClock } from "@/contexts/SolarClock";
import { useExplorer } from "@/contexts/Explorer";
import Camera from "@/components/celestial-bodies/camera";
import Sun from "@/components/celestial-bodies/sun";
import Body from "@/components/celestial-bodies/body";
import OrbitalPath from "@/components/effects/orbital-path";
import SolarParticles from "@/components/effects/solar-particles";
import CompositorEffect from "@/components/effects/composite";
import { useSolarData } from "@/contexts/SolarData";
import { registerShaderChunks } from "@/lib/glsl";

/**
 * Scene graph for the explorer.
 *
 * Replaces `gfx/OrbitViewer.ts`, which owned the renderer, scene, camera,
 * lights and every body as one 620-line class. Under R3F the Canvas owns the
 * renderer and each of those concerns is a component.
 */

// Chunks must be registered on three's ShaderChunk before any material that
// #includes them compiles. Module scope runs once, ahead of first render.
registerShaderChunks();

/**
 * Bodies are rendered larger than life. At true scale Earth is 4.2e-5 AU
 * across in a scene spanning tens of AU.
 *
 * !!! TEMPORARY -- MUST BE RESTORED TO 100 BEFORE RELEASE !!!
 *
 * The legacy `gfx/solar/Planet.ts` scaled by
 * `PlanetRadiusMap[type] * KM2AU * PLANET_SCALE * 100`, so 100 is the correct,
 * faithful value. At 100 the planets are sub-pixel at the default
 * system-wide framing: in the legacy viewer that view was carried by the
 * particle field of tens of thousands of minor bodies, which is not ported
 * yet. 1200 is a development-only exaggeration that keeps the scene legible
 * until SolarParticles/GPUSim land.
 *
 * Tracked in DEVIATIONS.md -- remove this note and the entry together.
 */
const BODY_RADIUS_SCALE = 1200;

/** Default radius for dwarf planets, which are not in PlanetRadiusMap. */
const DEFAULT_RADIUS_KM = 1200;

/**
 * Drives the simulation clock. Exactly one of these may exist.
 *
 * Priority -2 puts it first in the frame: the GPU simulation (-1) samples the
 * date it sets, and the compositor (1) renders the result.
 */
const ClockDriver: FunctionComponent = () => {
  const { advance } = useSolarClock();
  useFrame((_, delta) => advance(delta), -2);
  return null;
};

const Scene: FunctionComponent = () => {
  const { planets, dwarfPlanets, categories, params } = useExplorer();
  const { elements: mpcElements, quality } = useSolarData();

  const planetElements = useMemo<Array<OrbitElements>>(
    () => planets.map((p) => fromPlanetElements(p)),
    [planets]
  );

  const dwarfElements = useMemo<Array<OrbitElements>>(
    () => dwarfPlanets.map((p) => fromPlanetElements(p)),
    [dwarfPlanets]
  );

  // Schlyter's perturbation terms for the giants need the mean anomalies of
  // Jupiter, Saturn and Uranus, so those three elements are passed down.
  const perturbations = useMemo<PerturbationContext>(() => {
    const byId = Object.fromEntries(planetElements.map((el) => [el.id, el]));
    return {
      jupiter: byId.jupiter,
      saturn: byId.saturn,
      uranus: byId.uranus,
    };
  }, [planetElements]);

  const categoryColor = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => {
      if (
        category &&
        "slug" in category &&
        category.slug &&
        category.mainColor
      ) {
        map.set(category.slug, category.mainColor);
      }
    });
    return map;
  }, [categories]);

  const all = useMemo(
    () => [...planetElements, ...dwarfElements],
    [planetElements, dwarfElements]
  );

  const planetsColor = categoryColor.get("planets-moons") ?? null;

  return (
    <>
      <ClockDriver />
      <Camera />

      {/* Takes over the render loop: scene, glow, blur, composite. */}
      <CompositorEffect quality={quality} />

      {/* The sun is the only light source; everything else is lit by it. */}
      <pointLight position={[0, 0, 0]} intensity={2} decay={0} />
      {/* A trace of ambient keeps night sides from going fully black, which
          reads as a hole rather than a shadowed limb. */}
      <ambientLight intensity={0.03} />

      <Sun />

      {/* The minor-body field: hundreds of thousands of objects propagated on
          the GPU. This is what fills the default system-wide view. */}
      {mpcElements.length > 0 && (
        <SolarParticles
          elements={mpcElements}
          quality={quality}
          categoryColors={categoryColor}
          dimmed={Boolean(params.object)}
        />
      )}

      {all.map((elements) => {
        const id = elements.id.toLowerCase();
        const radiusKm = isPlanetId(id)
          ? PlanetRadiusMap[id]
          : DEFAULT_RADIUS_KM;

        return (
          <group key={elements.id}>
            <OrbitalPath
              elements={elements}
              color={planetsColor}
              selected={params.object === id}
              perturbations={perturbations}
            />
            <Body
              elements={elements}
              radiusKm={radiusKm}
              radiusScale={BODY_RADIUS_SCALE}
              perturbations={perturbations}
            />
          </group>
        );
      })}
    </>
  );
};

export default Scene;

export { BODY_RADIUS_SCALE, PLANET_SCALE, categoryFromTypeCode };
