import { isSolarCategory } from "./categoryLabels";
import type { OrbitElements, SolarCategory } from "./types";

/**
 * The curated objects Craft names, matched into the loaded MPC dataset by
 * designation. Ported from `OrbitViewer.createSolarItems()`; which objects
 * appear depends on the loaded tier, by design. See README.
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
   * What goes in the URL: Craft's `elementID`, the unpacked designation.
   * Deliberately not `id`, which is packed -- see README.
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
 * Case-sensitive -- see README. First write wins, as the legacy's `break` did.
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

    // Craft's category wins where it has one. Diverges from the legacy's
    // literal rule but not its effect -- see README.
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
