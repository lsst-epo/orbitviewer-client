/**
 * Site-level settings. Ported from the legacy `data/staticData.js`.
 *
 * These values will move into Craft fields; `lib/api/craft.ts#getGlobals`
 * already queries the SEO global set, and the rest of this object is the
 * remaining surface to migrate.
 */
import { env } from "@/env";
import { fallbackLng, languages } from "@/lib/i18n/settings";

export const GLOBALS = {
  title: "Orbitviewer",
  description: "Vera Rubin's interactive explorer.",
  languages,
  defaultLanguage: fallbackLng,
  rootDomain: env.ROOT_DOMAIN,
  og: {
    basePath: "/images/og/",
    default: "default.webp",
  },
} as const;

/**
 * Objects with a bespoke Open Graph card. Everything else falls back to
 * `og.default`. Ported from the planetIds check in the legacy data/objects.js.
 */
const OG_OVERRIDES: Record<string, string> = {
  sol: "sun.webp",
  mercury: "mercury.webp",
  venus: "venus.webp",
  earth: "earth.webp",
  mars: "mars.webp",
  jupiter: "jupiter.webp",
  saturn: "saturn.webp",
  uranus: "uranus.webp",
  neptune: "neptune.webp",
};

export const ogImageForElement = (elementId?: string | null): string => {
  const key = elementId?.toLowerCase() ?? "";
  return `${GLOBALS.og.basePath}${OG_OVERRIDES[key] ?? GLOBALS.og.default}`;
};
