"use client";

import { useEffect, useMemo, useRef, type FunctionComponent } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { KM2AU, PLANET_SCALE } from "@/lib/solar/constants";
import { resolveObject } from "@/lib/explorer/resolveObject";
import { orbitFraming } from "@/components/scene/effects/orbital-path/buildPath";
import type { CameraTarget } from "@/components/scene/celestial-bodies/camera";
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
import Camera from "@/components/scene/celestial-bodies/camera";
import Sun, { SUN_SCENE_RADIUS } from "@/components/scene/celestial-bodies/sun";
import Body from "@/components/scene/celestial-bodies/body";
import BodyLabel from "@/components/scene/celestial-bodies/label";
import OrbitalPath from "@/components/scene/effects/orbital-path";
import SolarParticles from "@/components/scene/effects/solar-particles";
import CompositorEffect from "@/components/scene/effects/composite";
import { useEarthClouds } from "@/components/scene/effects/clouds";
import { useSolarData } from "@/contexts/SolarData";
import { registerShaderChunks } from "@/lib/glsl";

/** Scene graph for the explorer, replacing the legacy's viewer class. */

/* Must run before any material that #includes them compiles; module scope
   runs once, ahead of first render. */
registerShaderChunks();

/** Bodies are rendered larger than life, 100x as the legacy did. README. */
const BODY_RADIUS_SCALE = 100;

/** Default radius for dwarf planets, which are not in PlanetRadiusMap. */
const DEFAULT_RADIUS_KM = 1200;

/** Assumed radius for a catalogue object; the dataset carries no size. */
const FOCUSED_OBJECT_RADIUS_KM = 5;

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
  const { elements: mpcElements, quality, datasetQuality } = useSolarData();

  const cloudsMap = useEarthClouds(quality);

  const planetElements = useMemo<Array<OrbitElements>>(
    () => planets.map((p) => fromPlanetElements(p)),
    [planets]
  );

  const dwarfElements = useMemo<Array<OrbitElements>>(
    () => dwarfPlanets.map((p) => fromPlanetElements(p)),
    [dwarfPlanets]
  );

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

  const focusedSun =
    !focused && ["sol", "sun"].includes((params.object ?? "").toLowerCase());

  const focusTarget = useRef<CameraTarget | null>(null);
  if ((focused || focusedSun) && !focusTarget.current) {
    focusTarget.current = { position: new Vector3(), radius: 1 };
  }

  useEffect(() => {
    if (!focusedSun || !focusTarget.current) return;
    focusTarget.current.position.set(0, 0, 0);
    focusTarget.current.radius = SUN_SCENE_RADIUS;
  }, [focusedSun]);

  const orbitView =
    (params.view ?? defaultViewFor(focused?.id)) === "orbit" &&
    Boolean(focused);

  const orbitTarget = useMemo<CameraTarget | null>(() => {
    if (!orbitView || !focused) return null;
    return orbitFraming(focused);
  }, [orbitView, focused]);

  const orbitTargetRef = useRef<CameraTarget | null>(null);
  orbitTargetRef.current = orbitTarget;

  const focusedIsBody = Boolean(
    focused &&
    (all.some((element) => element.id === focused.id) ||
      namedObjects.some((named) => named.id === focused.id))
  );

  const planetsColor = categoryColor.get("planets-moons") ?? null;

  const rubinOnly =
    params.discovery === "rubin"
      ? true
      : params.discovery === "other"
        ? false
        : undefined;

  const filters = useMemo<ObjectFilters>(
    () => ({
      // Undefined skips the category test entirely; only worth passing a set
      // once something is actually switched off.
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

      <CompositorEffect quality={quality} />

      <pointLight position={[0, 0, 0]} intensity={2} decay={0} />
      <ambientLight intensity={0.03} />

      <Sun />

      {mpcElements.length > 0 && datasetQuality && (
        <SolarParticles
          elements={mpcElements}
          quality={datasetQuality}
          categoryColors={categoryColor}
          visibleCategories={filters.categories}
          distanceRange={filters.distance}
          rubinOnly={filters.rubinOnly}
          dimmed={Boolean(params.object)}
        />
      )}

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
              onClick={openObject}
            />
          </group>
        );
      })}

      {namedObjects.map(({ id, shareId, title, category, elements }) => {
        const selected = focused?.id === id;

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
              // Craft's id, not the element's: it is what reaches the URL.
              selectId={shareId}
              label={
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
