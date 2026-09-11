export const categories = [
  { code: 7, key: "planets_moons", color: "#458dd3" },
  { code: 1, key: "asteroids", color: "#b1f2ef" },
  { code: 2, key: "near_earth_objects", color: "#986ae1" },
  { code: 3, key: "trans_neptunian_objects", color: "#009494" },
  { code: 4, key: "centaurs", color: "#ff6eb4" },
  { code: 5, key: "comets", color: "#50c878" },
  { code: 6, key: "interstellar_objects", color: "#718e3e" },
  { code: 8, key: "trojans", color: "#e05858" },
] as const;
export function categoryColor(types: number[] = []) {
  return (
    categories.find(({ code }) => types.includes(code))?.color ?? "#b1f2ef"
  );
}
