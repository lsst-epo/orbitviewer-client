import { getRequestConfig } from "next-intl/server";
import { fallbackLng, isLocale } from "./settings";
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isLocale(requested) ? requested : fallbackLng;
  return { locale, messages: {} };
});
