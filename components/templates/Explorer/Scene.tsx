"use client";

import { useEffect, useMemo, useRef, type FunctionComponent } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { KM2AU, PLANET_SCALE } from "@/lib/solar/constants";
import { resolveObject } from "@/lib/explorer/resolveObject";
import { orbitFraming } from "@/components/effects/orbital-path/buildPath";
import type { CameraTarget } from "@/components/celestial-bodies/camera";
import { fromPlanetElements, categoryFromTypeCode } from "@/lib/solar/elements";
import { categoryColorMap } from "@/lib/solar/categoryColors";
import { ALL_CATEGORIES } from "@/lib/solar/categoryLabels";
import { PlanetRadiusMap, isPlanetId } from "@/lib/solar/planets";
import type { PerturbationContext } from "@/lib/solar/orbits";
import type { OrbitElements } from "@/lib/solar/types";
import { useSolarClock } from "@/contexts/SolarClock";
import { useExplorer, solarElementEntries } from "@/contexts/Explorer";
import Camera from "@/components/celestial-bodies/camera";
import Sun, { SUN_SCENE_RADIUS } from "@/components/celestial-bodies/sun";
import Body from "@/components/celestial-bodies/body";
import BodyLabel from "@/components/celestial-bodies/label";
import OrbitalPath from "@/components/effects/orbital-path";
import SolarParticles from "@/components/effects/solar-particles";
import CompositorEffect from "@/components/effects/composite";
import { useEarthClouds } from "@/components/effects/clouds";
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
 * 100x matches the legacy `gfx/solar/Planet.ts`, which scaled by
 * `PlanetRadiusMap[type] * KM2AU * PLANET_SCALE * 100`. The planets are
 * sub-pixel at the default system-wide framing by design -- that view is
 * carried by the particle field of minor bodies, not by the planets.
 */
const BODY_RADIUS_SCALE = 100;

/** Default radius for dwarf planets, which are not in PlanetRadiusMap. */
const DEFAULT_RADIUS_KM = 1200;

/**
 * Nominal radius for a focused catalogue object. The MPC dataset carries no
 * size, so one is assumed purely to give the camera something to frame
 * against; most of these bodies are a few km across.
 */
const FOCUSED_OBJECT_RADIUS_KM = 5;

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
  const {
    planets,
    dwarfPlanets,
    categories,
    params,
    visibleCategories,
    openObject,
    elements: craftElements,
  } = useExplorer();
  const { elements: mpcElements, quality } = useSolarData();

  // One cloud field for the whole scene; only Earth samples it.
  const cloudsMap = useEarthClouds(quality);

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

  const categoryColor = useMemo(
    () => categoryColorMap(categories),
    [categories]
  );

  /**
   * Craft's display names, keyed by element id. The orbital data's
   * `fulldesignation` is the catalogue name -- "Earth-Moon Barycenter (3)" --
   * which is not what belongs on a label.
   */
  const craftTitles = useMemo(
    () =>
      new Map(
        solarElementEntries(craftElements).flatMap((entry) =>
          entry.elementID && entry.title
            ? [[entry.elementID.toLowerCase(), entry.title]]
            : []
        )
      ),
    [craftElements]
  );

  const all = useMemo(
    () => [...planetElements, ...dwarfElements],
    [planetElements, dwarfElements]
  );

  /**
   * The object named in the URL, resolved across every source we hold.
   *
   * Case-sensitive first: MPC packed designations encode their cycle count in
   * base 62, so "a" and "A" are different identifiers.
   */
  const focused = useMemo(
    () => resolveObject(params.object, [all, mpcElements]),
    [params.object, all, mpcElements]
  );

  /**
   * The Sun has a Craft entry but no orbital elements, so `resolveObject`
   * never finds it. The legacy had a separate `followSun()` for the same
   * reason. It sits at the origin and never moves.
   */
  const focusedSun =
    !focused && ["sol", "sun"].includes((params.object ?? "").toLowerCase());

  /**
   * Live position of the followed body. Written by whichever body is focused
   * and read by the camera each frame, so following costs no React renders.
   */
  const focusTarget = useRef<CameraTarget | null>(null);
  if ((focused || focusedSun) && !focusTarget.current) {
    focusTarget.current = { position: new Vector3(), radius: 1 };
  }

  useEffect(() => {
    if (!focusedSun || !focusTarget.current) return;
    focusTarget.current.position.set(0, 0, 0);
    focusTarget.current.radius = SUN_SCENE_RADIUS;
  }, [focusedSun]);

  /**
   * Orbit view: the camera frames the whole path instead of the body.
   *
   * Without this a selected path is drawn at full opacity and then left off
   * screen, because the camera is parked a few body-radii away -- so in the
   * port so far no orbit has ever actually been visible while selected. The
   * legacy solved it with an ORBIT/OBJECT toggle; this is the same idea, with
   * the choice in the URL so the framing is shareable.
   *
   * The pivot is fixed rather than written per frame: an orbit does not move.
   */
  const orbitView = params.view === "orbit";

  const orbitTarget = useMemo<CameraTarget | null>(() => {
    if (!orbitView || !focused) return null;
    return orbitFraming(focused);
  }, [orbitView, focused]);

  const orbitTargetRef = useRef<CameraTarget | null>(null);
  orbitTargetRef.current = orbitTarget;

  /**
   * A focused MPC object is not one of the thirteen bodies in the scene -- it
   * only exists as a texel in the GPU simulation, which the CPU cannot read
   * back cheaply. Propagating a single orbit per frame is negligible, so the
   * focused object gets its own body, exactly as the legacy created a
   * SolarElement for it.
   */
  const focusedIsBody = Boolean(
    focused && all.some((element) => element.id === focused.id)
  );

  const planetsColor = categoryColor.get("planets-moons") ?? null;

  /**
   * The discovery filter is tri-state in the URL but boolean in the scene:
   * undefined means no filtering at all, which is not the same as false.
   */
  const rubinOnly =
    params.discovery === "rubin"
      ? true
      : params.discovery === "other"
        ? false
        : undefined;

  return (
    <>
      <ClockDriver />
      <Camera
        targetRef={
          orbitTarget
            ? orbitTargetRef
            : focused || focusedSun
              ? focusTarget
              : undefined
        }
      />

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
          visibleCategories={
            // Undefined skips the category test entirely; the set is only
            // worth passing once something is switched off.
            visibleCategories.size === ALL_CATEGORIES.length
              ? undefined
              : visibleCategories
          }
          distanceRange={
            params.distance
              ? { min: params.distance[0], max: params.distance[1] }
              : undefined
          }
          rubinOnly={rubinOnly}
          dimmed={Boolean(params.object)}
        />
      )}

      {/* A focused catalogue object, rendered so the camera has something to
          follow and the user something to see. */}
      {focused && !focusedIsBody && (
        <group key={focused.id}>
          <OrbitalPath
            elements={focused}
            color={categoryColor.get(focused.category) ?? null}
            selected
            view={orbitView ? "orbit" : "object"}
            fadeRadius={
              FOCUSED_OBJECT_RADIUS_KM *
              KM2AU *
              PLANET_SCALE *
              BODY_RADIUS_SCALE
            }
            perturbations={perturbations}
          />
          <Body
            elements={focused}
            radiusKm={FOCUSED_OBJECT_RADIUS_KM}
            radiusScale={BODY_RADIUS_SCALE}
            perturbations={perturbations}
            focusRef={focusTarget}
          />
        </group>
      )}

      {/* Switching "planets-moons" off hides the named bodies and their
          orbits, not just the particles -- in the legacy one filter governed
          both, since `UserFilters.categories` also gated `SolarElement`.
          A focused body stays, so a share link to one still shows it. */}
      {all.map((elements) => {
        if (
          !visibleCategories.has("planets-moons") &&
          focused?.id !== elements.id
        ) {
          return null;
        }

        const id = elements.id.toLowerCase();
        const radiusKm = isPlanetId(id)
          ? PlanetRadiusMap[id]
          : DEFAULT_RADIUS_KM;

        return (
          <group key={elements.id}>
            <OrbitalPath
              elements={elements}
              color={planetsColor}
              // Compared against the resolved object rather than the raw
              // param, which may differ in case from the element's id.
              selected={focused?.id === elements.id}
              view={orbitView ? "orbit" : "object"}
              fadeRadius={radiusKm * KM2AU * PLANET_SCALE * BODY_RADIUS_SCALE}
              perturbations={perturbations}
            />
            <Body
              elements={elements}
              radiusKm={radiusKm}
              radiusScale={BODY_RADIUS_SCALE}
              perturbations={perturbations}
              cloudsMap={id === "earth" ? cloudsMap : null}
              focusRef={focused?.id === elements.id ? focusTarget : null}
              label={
                // Not for the selected body: its name is already in the
                // panel, and the legacy hid it there too.
                focused?.id === elements.id ? null : (
                  <BodyLabel
                    id={elements.id}
                    name={craftTitles.get(id) ?? elements.fulldesignation}
                    category={elements.category}
                    color={categoryColor.get(elements.category) ?? null}
                    radius={radiusKm * KM2AU * PLANET_SCALE * BODY_RADIUS_SCALE}
                    onSelect={openObject}
                  />
                )
              }
              // The legacy put a projected DOM anchor over each body to catch
              // clicks; raycasting the mesh itself is pixel-accurate and needs
              // no per-frame screen-space projection.
              onClick={openObject}
            />
          </group>
        );
      })}
    </>
  );
};

export default Scene;

export { BODY_RADIUS_SCALE, PLANET_SCALE, categoryFromTypeCode };
