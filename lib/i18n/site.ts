import { fallbackLng } from "./settings";

/**
 * Craft addresses its sites by numeric id rather than handle -- the legacy
 * `data/craft.js` passed `siteId: "1"` for English and `"2"` for Spanish.
 */
const SITE_IDS: Record<string, string> = {
  en: "1",
  es: "2",
};

export const siteIdFromLocale = (locale: string): string =>
  SITE_IDS[locale] ?? SITE_IDS[fallbackLng];

export const localeFromSiteId = (siteId: string): string =>
  Object.entries(SITE_IDS).find(([, id]) => id === siteId)?.[0] ?? fallbackLng;
