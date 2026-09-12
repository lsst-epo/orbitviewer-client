export const categories = [
  { code: 7, key: "planets_moons", color: "#b1f2ef" },
  { code: 1, key: "asteroids", color: "#ff6eb4" },
  { code: 2, key: "near_earth_objects", color: "#8c59de" },
  { code: 3, key: "trans_neptunian_objects", color: "#008b8b" },
  { code: 4, key: "centaurs", color: "#448dd3" },
  { code: 5, key: "comets", color: "#50c879" },
  { code: 6, key: "interstellar_objects", color: "#516b2e" },
  { code: 8, key: "trojans", color: "#ffa200" },
] as const;
export function categoryCode(types: number[] = []) {
  return [1, 5, 4, 6, 2, 3, 8, 7].find((value) => types.includes(value));
}

export type CategoryPalette = Record<number, string>;
export function categoryColor(
  types: number[] = [],
  palette: CategoryPalette = {},
) {
  // Match legacy categoriesSort: an object can belong to several categories.
  const code = categoryCode(types);
  return code === undefined
    ? "#999999"
    : (palette[code] ??
        categories.find((category) => category.code === code)?.color ??
        "#999999");
}
