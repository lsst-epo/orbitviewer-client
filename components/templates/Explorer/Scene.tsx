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
import { resolveNamedObjects } from "@/lib/solar/solarItems";
import { matchesFilters, type ObjectFilters } from "@/lib/solar/filters";
import { ALL_CATEGORIES } from "@/lib/solar/categoryLabels";
import { PlanetRadiusMap, isPlanetId } from "@/lib/solar/planets";
import { defaultViewFor } from "@/lib/explorer/searchParams";
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

/** Scene graph for the explorer, replacing `gfx/OrbitViewer.ts`. */

// Chunks must be registered on three's ShaderChunk before any material that
// #includes them compiles. Module scope runs once, ahead of first render.
registerShaderChunks();

/** Bodies are rendered larger than life, 100x as the legacy did. README. */
const BODY_RADIUS_SCALE = 100;

/** Default radius for dwarf planets, which are not in PlanetRadiusMap. */
const DEFAULT_RADIUS_KM = 1200;

/** Assumed radius for a catalogue object; the dataset carries no size. */
const FOCUSED_OBJECT_RADIUS_KM = 5;

/**
 * Drives the simulation clock. Exactly one of these may exist.
 *
 * Priority -2 puts it first in the frame: the GPU simulation (-1) samples the
 * date it sets, and the compositor (1) renders the result.
 */
/** `FOCUSED_OBJECT_RADIUS_KM` in scene units. */
const CATALOGUE_RADIUS =
  FOCUSED_OBJECT_RADIUS_KM * KM2AU * PLANET_SCALE * BODY_RADIUS_SCALE;

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

  /** Craft's display names. `fulldesignation` is the catalogue name, not a label. */
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

  /** Craft's curated objects, found in the loaded dataset. */
  const namedObjects = useMemo(
    () => resolveNamedObjects(solarElementEntries(craftElements), mpcElements),
    [craftElements, mpcElements]
  );

  /** The object named in the URL, resolved across every source we hold. */
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
   * Orbit view frames the whole path instead of the body. The default depends
   * on the body (`defaultViewFor`); an explicit `?view=` wins. See README.
   */
  const orbitView =
    (params.view ?? defaultViewFor(focused?.id)) === "orbit" &&
    Boolean(focused);

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
    focused &&
    (all.some((element) => element.id === focused.id) ||
      namedObjects.some((named) => named.id === focused.id))
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

  /**
   * One filter set for the whole scene. The particle field applies it in a
   * shader attribute and the named bodies apply it in React, and the two
   * must not drift -- a named object left visible after its category is
   * switched off would be the only one of its kind still on screen.
   */
  const filters = useMemo<ObjectFilters>(
    () => ({
      // Undefined skips the category test entirely; the set is only worth
      // passing once something is switched off.
      categories:
        visibleCategories.size === ALL_CATEGORIES.length
          ? undefined
          : visibleCategories,
      distance: params.distance
        ? { min: params.distance[0], max: params.distance[1] }
        : undefined,
      rubinOnly,
    }),
    [visibleCategories, params.distance, rubinOnly]
  );

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
          visibleCategories={filters.categories}
          distanceRange={filters.distance}
          rubinOnly={filters.rubinOnly}
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
            fadeRadius={CATALOGUE_RADIUS}
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
                // Hidden for the selected body only in object view, where the
                // camera is a few radii away and the panel already names it.
                // In orbit view it has to stay: the camera is far enough out
                // to see the whole path, and the body is a dot somewhere on
                // it. The legacy makes the same distinction in one line --
                // `sel.domRef.dom.style.opacity = followOrbit ? 1 : 0`.
                focused?.id === elements.id && !orbitView ? null : (
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

      {/* Craft's named minor bodies: an orbit path and a labelled marker each.
          These carry the categories -- Trojan, centaur, TNO, NEO, comet,
          interstellar -- that the planets, all "planets-moons", never show.

          The legacy gave each one a `SolarElement` with its mesh commented
          out, so a body here is a point the label and camera hang off rather
          than something meant to be seen at this distance. */}
      {namedObjects.map(({ id, shareId, title, category, elements }) => {
        const selected = focused?.id === id;

        // A selected object stays put whatever the filters say, so a shared
        // link to one still shows it -- as for the planets above.
        if (!selected && !matchesFilters(elements, filters)) return null;

        const color = categoryColor.get(category) ?? null;

        return (
          <group key={id}>
            <OrbitalPath
              elements={elements}
              color={color}
              selected={selected}
              view={orbitView ? "orbit" : "object"}
              fadeRadius={CATALOGUE_RADIUS}
              perturbations={perturbations}
            />
            <Body
              elements={elements}
              radiusKm={FOCUSED_OBJECT_RADIUS_KM}
              radiusScale={BODY_RADIUS_SCALE}
              perturbations={perturbations}
              focusRef={selected ? focusTarget : null}
              // Craft's id, not the element's: it is what reaches the URL,
              // and the server can resolve it. See NamedObject.shareId.
              selectId={shareId}
              label={
                // Kept in orbit view, as for the planets above -- and it
                // matters more here, since these have no visible body to
                // mark where on the path they are.
                selected && !orbitView ? null : (
                  <BodyLabel
                    id={shareId}
                    name={title}
                    category={category}
                    color={color}
                    radius={CATALOGUE_RADIUS}
                    onSelect={openObject}
                  />
                )
              }
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
