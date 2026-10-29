import resourcesToBackend from "i18next-resources-to-backend";
import { fallbackLng } from "./settings";

type ResourceLoader = () => Promise<{ default: Record<string, unknown> }>;

/** Explicit loader map: Turbopack cannot analyse a two-segment import. */
const resources: Record<string, Record<string, ResourceLoader>> = {
  en: {
    translation: () => import("./localeStrings/en/translation.json"),
    "epo-react-lib": () => import("@epo-locale-strings/en/epo-react-lib.json"),
  },
  es: {
    translation: () => import("./localeStrings/es/translation.json"),
    "epo-react-lib": () => import("@epo-locale-strings/es/epo-react-lib.json"),
  },
};

export const loadResources = resourcesToBackend(
  (language: string, namespace: string, callback) => {
    const loader =
      resources[language]?.[namespace] ?? resources[fallbackLng]?.[namespace];

    if (!loader) {
      callback(new Error(`No resources for ${language}/${namespace}`), null);
      return;
    }

    loader()
      .then(({ default: bundle }) => callback(null, bundle))
      .catch((error) => callback(error, null));
  }
);

export const isDefaultLocale = (locale: string) => locale === fallbackLng;
