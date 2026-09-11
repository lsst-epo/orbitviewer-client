import type { PlanetId } from "@/lib/solar/planets";

import earth from "./textures/earth.webp";
import earthNight from "./textures/earth_night.webp";
import earthNormal from "./textures/earth_normal.webp";
import jupiter from "./textures/jupiter.webp";
import mars from "./textures/mars.webp";
import mercury from "./textures/mercury.webp";
import neptune from "./textures/neptune.webp";
import saturn from "./textures/saturn.webp";
import saturnRing from "./textures/saturn_ring.webp";
import uranus from "./textures/uranus.webp";
import venus from "./textures/venus.webp";

/**
 * Texture URLs for the bodies we ship maps for.
 *
 * STUB, per the port plan: these move to a Craft "texture" field so that the
 * generalised <Body> can render anything the CMS describes. The lookup below
 * is the seam -- `textureSetFor` will take the Craft-provided URLs and fall
 * back to these bundled assets, and no call site changes.
 *
 * Imported rather than hardcoded as public paths so Turbopack fingerprints
 * them and they get long-lived cache headers.
 */

export interface BodyTextureSet {
  map: string;
  nightMap?: string;
  normalMap?: string;
  ringMap?: string;
}

const BUNDLED: Partial<Record<PlanetId, BodyTextureSet>> = {
  mercury: { map: mercury.src },
  venus: { map: venus.src },
  earth: {
    map: earth.src,
    nightMap: earthNight.src,
    normalMap: earthNormal.src,
  },
  mars: { map: mars.src },
  jupiter: { map: jupiter.src },
  saturn: { map: saturn.src, ringMap: saturnRing.src },
  uranus: { map: uranus.src },
  neptune: { map: neptune.src },
};

/**
 * @param id   body identifier, matching Craft's elementID
 * @param fromCraft texture URLs supplied by the CMS, once that field exists
 */
export function textureSetFor(
  id: string,
  fromCraft?: Partial<BodyTextureSet>
): BodyTextureSet | undefined {
  const bundled = BUNDLED[id.toLowerCase() as PlanetId];

  if (!bundled && !fromCraft?.map) return undefined;

  return {
    map: fromCraft?.map ?? bundled!.map,
    nightMap: fromCraft?.nightMap ?? bundled?.nightMap,
    normalMap: fromCraft?.normalMap ?? bundled?.normalMap,
    ringMap: fromCraft?.ringMap ?? bundled?.ringMap,
  };
}

export const hasBundledTexture = (id: string): boolean =>
  id.toLowerCase() in BUNDLED;
