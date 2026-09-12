"use client";
import { useExplorer } from "@/contexts/ExplorerProvider";
import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { orbitPoints } from "@/lib/solar/orbits";
import type { OrbitRecord } from "@/lib/api/hasura";
import { categoryColor } from "@/lib/solar/categories";

/** Analytic conic path in AU; open conics never connect their endpoints. */
export function OrbitPath({
  record,
  selected = false,
}: {
  record: OrbitRecord;
  selected?: boolean;
}) {
  const { categoryPalette } = useExplorer();
  const points = useMemo(() => orbitPoints(record), [record]);
  return (
    <Line
      points={points}
      color={categoryColor(record.object_type, categoryPalette)}
      lineWidth={selected ? 1.5 : 0.6}
      transparent
      opacity={selected ? 0.9 : 0.4}
    />
  );
}
