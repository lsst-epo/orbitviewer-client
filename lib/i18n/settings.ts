export const fallbackLng = "en";
export const languages = [fallbackLng, "es"];
export const defaultNS = "translation";
export const namespaces = [defaultNS, "epo-react-lib"];
export const cookieName = "NEXT_LOCALE";

export function getOptions(
  lng = fallbackLng,
  ns: string | string[] = defaultNS
) {
  return {
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  };
}
