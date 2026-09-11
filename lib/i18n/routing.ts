import { defineRouting } from "next-intl/routing";
import { fallbackLng, languages, cookieName } from "./settings";

export const routing = defineRouting({
  locales: languages,
  defaultLocale: fallbackLng,
  // "as-needed" drops the prefix for the default locale: /explorer (en) and
  // /es/explorer. next-intl redirects legacy /en/* paths to their unprefixed
  // equivalent, so existing English URLs resolve without extra config.
  localePrefix: "as-needed",
  localeCookie: {
    name: cookieName,
  },
});
