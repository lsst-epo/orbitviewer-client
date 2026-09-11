export const fallbackLng = "en";
export const languages = ["en", "es"] as const;
export type Locale = (typeof languages)[number];
export const cookieName = "NEXT_LOCALE";
export function isLocale(value: string): value is Locale {
  return languages.some((locale) => locale === value);
}
