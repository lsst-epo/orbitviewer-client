"use client";
import { createInstance } from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { useMemo, type ReactNode } from "react";
import { resources } from "@/lib/i18n/resources";
import type { Locale } from "@/lib/i18n/settings";

export function TranslationProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const i18n = useMemo(() => {
    const instance = createInstance();
    void instance.use(initReactI18next).init({
      lng: locale,
      fallbackLng: "en",
      resources,
      initImmediate: false,
      interpolation: { escapeValue: false },
    });
    return instance;
  }, [locale]);
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
