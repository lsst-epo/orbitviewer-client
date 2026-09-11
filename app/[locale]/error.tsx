"use client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/atoms/Button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useTranslation();
  return (
    <main style={{ padding: "3rem" }}>
      <h1>{t("ui.unavailable")}</h1>
      <Button onClick={reset}>{t("ui.retry")}</Button>
    </main>
  );
}
