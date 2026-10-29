"server-only";

import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next/initReactI18next";
import { getLocale } from "next-intl/server";
import { getOptions } from "./settings";
import { loadResources } from "./index";

const initI18next = async (lng: string, ns: string | string[]) => {
  const i18nInstance = createInstance();
  await i18nInstance
    .use(initReactI18next)
    .use(loadResources)
    .init(getOptions(lng, ns));
  return i18nInstance;
};

async function useTranslation(
  lng?: string,
  ns: string | string[] = "translation",
  options: { keyPrefix?: string } = {}
) {
  const locale = lng || (await getLocale());
  const i18nextInstance = await initI18next(locale, ns);

  return {
    t: i18nextInstance.getFixedT(
      locale,
      Array.isArray(ns) ? ns[0] : ns,
      options.keyPrefix
    ),
    i18n: i18nextInstance,
  };
}

export { useTranslation, useTranslation as serverTranslation };
