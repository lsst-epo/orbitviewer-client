"use client";

import { FunctionComponent, PropsWithChildren } from "react";
import { I18nextProvider } from "react-i18next";
import i18next from "i18next";
import useClientTranslation from "@/lib/i18n/client";

interface I18NextClientProviderProps {
  locale: string;
}

const I18NextClientProvider: FunctionComponent<
  PropsWithChildren<I18NextClientProviderProps>
> = ({ children, locale }) => {
  // Side effect of the hook: syncs the singleton to the active locale.
  useClientTranslation(locale);

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
};

export default I18NextClientProvider;
