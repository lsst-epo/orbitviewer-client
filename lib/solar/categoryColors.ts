import type { Category } from "@/contexts/Explorer";

/**
 * Category slug to hex colour, from Craft's `objectTypes` category group.
 *
 * Replaces the legacy `createCategoryColorMap`. Colours are authored in the
 * CMS rather than hardcoded, so the particle field, the search results and
 * the object chip all stay in step when one is changed there.
 *
 * `categories` is a union across Craft's category types, so each entry is
 * narrowed before its slug and colour are read.
 */
export const categoryColorMap = (
  categories: Array<Category>
): Map<string, string> =>
  new Map(
    categories.flatMap((category) =>
      category && "slug" in category && category.slug && category.mainColor
        ? [[category.slug, category.mainColor] as const]
        : []
    )
  );
