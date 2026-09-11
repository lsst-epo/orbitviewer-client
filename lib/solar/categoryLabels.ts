import type { SolarCategory } from "./types";

/**
 * Category display metadata.
 *
 * The catalogue's category slugs and the translation keys for them do not
 * line up -- the copy file uses underscores, and calls jupiter-trojans simply
 * "trojans" -- so the mapping is explicit rather than derived. The legacy
 * papered over this with a nine-branch if/else in `ObjectPage.revealCategoryChip`
 * plus a hardcoded `CategoryNames` table per language; both are replaced by
 * this one table and the copy file.
 *
 * `icon` is the id in `components/atoms/Icon`, which matches the slug.
 */
export const CATEGORY_LABELS: Record<
  SolarCategory,
  { icon: SolarCategory; nameKey: string; descriptionKey: string }
> = {
  "planets-moons": {
    icon: "planets-moons",
    nameKey: "objects.types.planets_moons.name",
    descriptionKey: "objects.types.planets_moons.description",
  },
  "near-earth-objects": {
    icon: "near-earth-objects",
    nameKey: "objects.types.near_earth_objects.name",
    descriptionKey: "objects.types.near_earth_objects.description",
  },
  asteroids: {
    icon: "asteroids",
    nameKey: "objects.types.asteroids.name",
    descriptionKey: "objects.types.asteroids.description",
  },
  comets: {
    icon: "comets",
    nameKey: "objects.types.comets.name",
    descriptionKey: "objects.types.comets.description",
  },
  centaurs: {
    icon: "centaurs",
    nameKey: "objects.types.centaurs.name",
    descriptionKey: "objects.types.centaurs.description",
  },
  "trans-neptunian-objects": {
    icon: "trans-neptunian-objects",
    nameKey: "objects.types.trans_neptunian_objects.name",
    descriptionKey: "objects.types.trans_neptunian_objects.description",
  },
  "interstellar-objects": {
    icon: "interstellar-objects",
    nameKey: "objects.types.interstellar_objects.name",
    descriptionKey: "objects.types.interstellar_objects.description",
  },
  "jupiter-trojans": {
    icon: "jupiter-trojans",
    nameKey: "objects.types.trojans.name",
    descriptionKey: "objects.types.trojans.description",
  },
};

/**
 * Display order for the category list, matching the legacy `objects.njk`,
 * which iterated the copy file's `objects.types` in declaration order.
 */
export const ALL_CATEGORIES = Object.keys(
  CATEGORY_LABELS
) as Array<SolarCategory>;

/** Narrows an arbitrary slug -- a CMS value, a URL parameter -- to a category. */
export const isSolarCategory = (slug: string): slug is SolarCategory =>
  Object.hasOwn(CATEGORY_LABELS, slug);
