"use client";

import { FunctionComponent, PropsWithChildren, useLayoutEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18next from "i18next";
import useClientTranslation from "@/lib/i18n/client";

interface I18NextClientProviderProps {
  locale: string;
}

const I18NextClientProvider: FunctionComponent<
  PropsWithChildren<I18NextClientProviderProps>
> = ({ children, locale }) => {
  useClientTranslation(locale);

  // The client instance only reads <html lang> once, at init, so a locale
  // switch within the session would leave every string in the old language.
  // Layout effect, so the change lands before the new locale paints.
  useLayoutEffect(() => {
    if (i18next.resolvedLanguage !== locale) i18next.changeLanguage(locale);
  }, [locale]);

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
};

export default I18NextClientProvider;
