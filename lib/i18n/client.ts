"use client";

import i18next from "i18next";
import {
  initReactI18next,
  useTranslation as useTranslationOrg,
} from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import {
  defaultNS,
  languages,
  getOptions,
  namespaces,
  cookieName,
  fallbackLng,
} from "./settings";
import { loadResources } from "./index";

const runsOnServerSide = typeof window === "undefined";

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(loadResources)
  .init({
    ...getOptions(),
    ns: namespaces,
    fallbackNS: namespaces,
    lng: undefined, // detect on the client
    detection: {
      excludeCacheFor: languages,
      lookupCookie: cookieName,
      order: ["htmlTag", "cookie", "navigator"],
    },
    preload: runsOnServerSide ? languages : [],
  });

export default function useClientTranslation(
  lng: string = fallbackLng,
  ns: string = defaultNS,
  options?: Record<string, unknown>
) {
  const instance = useTranslationOrg(ns, options);
  const { i18n } = instance;

  if (runsOnServerSide && i18n.resolvedLanguage !== lng) {
    i18n.changeLanguage(lng);
  }
  return instance;
}
