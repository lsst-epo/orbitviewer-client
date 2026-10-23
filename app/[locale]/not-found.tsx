"use client";
import { useTranslation } from "react-i18next";
import { Link } from "@/lib/i18n/navigation";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: "var(--header-height) var(--site-margin-large)",
        textAlign: "center",
        gap: "24px",
      }}
    >
      <div>
        <h1
          style={{
            margin: "0 0 8px",
            color: "var(--color-text-low)",
            fontSize: "20px",
            lineHeight: "24px",
            fontWeight: 400,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          {t("e404.title")}
        </h1>
        <p
          style={{
            margin: 0,
            fontWeight: 900,
            textTransform: "uppercase",
            fontSize: "clamp(40px, 8vw, 128px)",
            lineHeight: 1,
          }}
        >
          {t("e404.subtitle")}
        </p>
      </div>
      <Link
        href="/explorer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          height: "48px",
          padding: "12px 24px",
          borderRadius: "var(--corner-medium)",
          background: "var(--color-turquoise-500)",
          color: "var(--color-black)",
          fontSize: "16px",
          lineHeight: "24px",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        {t("e404.action")}
      </Link>
    </main>
  );
}
