import type { CSSProperties } from "react";
import { Icon } from "@/components/atoms/Icon";
import {
  categories,
  categoryCode,
  categoryColor,
  type CategoryPalette,
} from "@/lib/solar/categories";
import styles from "./styles.module.css";

export function ObjectLabel({
  name,
  types,
  palette,
  selected,
  onSelect,
}: {
  name: string;
  types?: number[];
  palette: CategoryPalette;
  selected: boolean;
  onSelect: () => void;
}) {
  const isSun = types?.includes(9);
  const category = categories.find(({ code }) => code === categoryCode(types));
  const icon = isSun
    ? "sun_star"
    : category?.key === "trojans"
      ? "jupiter-trojans"
      : category?.key.replaceAll("_", "-");
  return (
    <button
      className={styles.label}
      style={
        {
          "--object-color": isSun
            ? "var(--color-sun)"
            : categoryColor(types, palette),
        } as CSSProperties
      }
      aria-label={name}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className={styles.icon}>{icon && <Icon name={icon} />}</span>
      <span className={styles.text}>{name}</span>
    </button>
  );
}
