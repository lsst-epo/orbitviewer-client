import { defineRouting } from "next-intl/routing";
import { languages, fallbackLng, cookieName } from "./settings";
export const routing = defineRouting({
  locales: languages,
  defaultLocale: fallbackLng,
  localePrefix: "as-needed",
  localeCookie: { name: cookieName },
});
