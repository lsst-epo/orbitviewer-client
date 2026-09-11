import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/settings";
import { getPlanetOrbits } from "@/lib/api/hasura";
import { getSolarEntries } from "@/lib/api/craft";
import { Explorer } from "@/components/organisms/Explorer";
export default async function ExplorerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [orbits, content] = await Promise.allSettled([
    getPlanetOrbits(),
    getSolarEntries(locale),
  ]);
  return (
    <Suspense>
      <Explorer
        initial={orbits.status === "fulfilled" ? orbits.value : []}
        entries={content.status === "fulfilled" ? content.value : []}
        contentError={content.status === "rejected"}
      />
    </Suspense>
  );
}
