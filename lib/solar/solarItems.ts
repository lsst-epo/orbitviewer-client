import { isSolarCategory } from "./categoryLabels";
import type { OrbitElements, SolarCategory } from "./types";

/**
 * The curated objects Craft names, matched into the loaded MPC dataset.
 *
 * Ported from `OrbitViewer.createSolarItems()`. Craft's `elements` section
 * holds around forty editorially chosen bodies -- Bennu, Chiron, Odysseus,
 * 'Oumuamua, the Rubin discoveries of the month -- identified only by a
 * designation string. The orbital elements are not in the CMS: each entry has
 * to be found in the MPC file by designation, and objects absent from the
 * loaded file simply do not appear.
 *
 * That last part is deliberate, and it is why this is resolved per dataset
 * rather than on the server. The low tier is 16,384 rows and carries 22 of
 * the 31 non-planet entries; the larger tiers carry more. The legacy searched
 * `LoadManager.data.sample` for exactly this reason, so which named objects
 * are labelled has always depended on the quality tier.
 */

/**
 * The shape this needs from a Craft `elements_default_Entry`. Declared
 * structurally rather than imported so that lib/solar stays free of the
 * generated CMS types and of the Explorer context.
 */
export interface SolarItemEntry {
  elementID?: string | null;
  title?: string | null;
  elementCategory?: ReadonlyArray<{ slug?: string | null } | null> | null;
}

export interface NamedObject {
  /** The element's own id -- the packed designation, where it has one. */
  id: string;
  /**
   * The identifier to put in the URL when this object is selected: Craft's
   * `elementID`, which is the unpacked designation (`1999 RQ36`).
   *
   * Not `id`. That is the packed form (`J99R36Q`), because `fromMpcRow`
   * prefers `mpcdesignation` -- and while the scene resolves either, the
   * server cannot. `generateMetadata` has the Craft entries but no dataset to
   * resolve against, so a packed id in the URL finds no entry and the share
   * card falls back to the bare designation instead of the object's name.
   *
   * Putting the editorial identifier in the URL is also what the legacy did,
   * by routing these to `/solar-items/<slug>/`.
   */
  shareId: string;
  /** Craft's display name, which is the point of the entry. */
  title: string;
  category: SolarCategory;
  /** The dataset's elements, with the category resolved. */
  elements: OrbitElements;
}

/** Craft's category slug for an entry, when it has one we recognise. */
function craftCategory(entry: SolarItemEntry): SolarCategory | null {
  const slug = entry.elementCategory?.[0]?.slug;
  return slug && isSolarCategory(slug) ? slug : null;
}

/**
 * Indexes the dataset by every designation an entry might name it with.
 *
 * Case-sensitive: MPC packed designations encode their cycle count in base 62,
 * where "A" is 10 and "a" is 36, so `K15Bo9Z` and `K15BO9Z` are different
 * objects. The unpacked `fulldesignation` is what Craft actually stores
 * ("1999 RQ36" for Bennu), but both are indexed because the legacy matched on
 * either.
 *
 * First write wins, matching the legacy's `break` on its first hit.
 */
function indexByDesignation(
  elements: Array<OrbitElements>
): Map<string, OrbitElements> {
  const index = new Map<string, OrbitElements>();

  for (const element of elements) {
    if (element.mpcDesignation && !index.has(element.mpcDesignation)) {
      index.set(element.mpcDesignation, element);
    }
    if (element.fulldesignation && !index.has(element.fulldesignation)) {
      index.set(element.fulldesignation, element);
    }
  }

  return index;
}

export interface ResolveOptions {
  /**
   * Categories rendered from their own source. "planets-moons" covers the
   * planets and dwarf planets, which come from the local orbit files and are
   * already in the scene; the legacy skipped them here for the same reason.
   */
  skipCategories?: ReadonlySet<SolarCategory>;
}

const DEFAULT_SKIP: ReadonlySet<SolarCategory> = new Set<SolarCategory>([
  "planets-moons",
]);

export function resolveNamedObjects(
  entries: ReadonlyArray<SolarItemEntry>,
  elements: Array<OrbitElements>,
  { skipCategories = DEFAULT_SKIP }: ResolveOptions = {}
): Array<NamedObject> {
  if (entries.length === 0 || elements.length === 0) return [];

  const index = indexByDesignation(elements);
  const named: Array<NamedObject> = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    const designation = entry.elementID;
    if (!designation) continue;

    const category = craftCategory(entry);
    if (category && skipCategories.has(category)) continue;

    const matched = index.get(designation);
    // The Sun falls out here without a special case: it has a Craft entry but
    // no orbital elements, so nothing in the dataset ever matches it. The
    // legacy reached the same outcome the long way round, building it a
    // SolarElement and then declining to give it a pointer because it had no
    // orbit path.
    if (!matched || seen.has(matched.id)) continue;

    seen.add(matched.id);

    // Craft's category wins where it has one. The legacy deferred to the
    // dataset and reached for Craft only when a row's `object_type` was `[0]`
    // or missing -- but the port cannot tell that case apart after mapping,
    // since `fromMpcRow` resolves an unclassified row to "asteroids".
    //
    // Checked against the live data before settling on this: across the 22
    // entries the low tier carries, the dataset and Craft never once disagree
    // where both have a value. The five that differ are all rows typed `[0]`,
    // which is precisely the case the legacy handed to Craft -- among them
    // Ka`epaoka`awela and Arrokoth, which would otherwise be drawn as plain
    // asteroids rather than a Trojan and a TNO. So this is the legacy's rule
    // in its effect, and it keeps the CMS authoritative for its own entries,
    // as it already is for their titles and colours.
    const resolved = category ?? matched.category;

    named.push({
      id: matched.id,
      shareId: designation,
      title: entry.title || matched.fulldesignation,
      category: resolved,
      elements:
        resolved === matched.category
          ? matched
          : { ...matched, category: resolved },
    });
  }

  return named;
}
