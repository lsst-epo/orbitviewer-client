"use client";
import { useTranslation } from "react-i18next";
import { Link } from "@/lib/i18n/navigation";
export default function NotFound() {
  const { t } = useTranslation();
  return (
    <main style={{ padding: "3rem" }}>
      <h1>{t("e404.subtitle")}</h1>
      <Link href="/explorer">{t("e404.action")}</Link>
    </main>
  );
}
