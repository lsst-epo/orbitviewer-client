// TODO Craft: query these fields once staticData/settings have corresponding CMS fields.
export const globals = {
  title: "Orbitviewer",
  description: "Vera Rubin's interactive explorer.",
  languages: ["en", "es"],
  defaultLanguage: "en",
  og: { basePath: "/images/og/", default: "default.webp" },
} as const;

export async function getSiteMetadata() {
  return globals;
}
