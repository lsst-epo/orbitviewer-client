"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { useExplorer } from "@/contexts/ExplorerProvider";
import { categories } from "@/lib/solar/categories";
import { Icon } from "@/components/atoms/Icon";
import styles from "./styles.module.css";

const order = [7, 2, 1, 5, 4, 3, 6, 8];

/** Category visibility is shared with the scene and survives closing the overlay. */
export function ObjectsOverlay({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { enabled, setEnabled, categoryPalette } = useExplorer();
  const dialog = useRef<HTMLDialogElement>(null);
  const cards = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  const scroll = (direction: number) => {
    const list = cards.current;
    if (!list) return;
    const card = list.firstElementChild;
    list.scrollBy({
      left: direction * ((card?.clientWidth ?? 320) + 12),
      behavior: "smooth",
    });
  };
  return (
    <dialog
      ref={dialog}
      className={styles.overlay}
      aria-labelledby="objects-title"
      onCancel={onClose}
    >
      <div className={styles.actions}>
        <button type="button" className={styles.back} onClick={onClose}>
          <Icon name="chevron-left" />
          <span>{t("objects.close")}</span>
        </button>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label={t("ui.close")}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className={styles.body}>
        <div className={styles.heading}>
          <h2 id="objects-title">{t("objects.title")}</h2>
          <p>{t("objects.subtitle")}</p>
        </div>
        <div className={styles.carousel}>
        <ul ref={cards} className={styles.cards}>
          {order.map((code) => {
            const category = categories.find((item) => item.code === code)!;
            const active = enabled.includes(code);
            const name = t(`objects.types.${category.key}.name`);
            return (
              <li
                key={code}
                className={styles.card}
                style={
                  {
                    "--category-color": categoryPalette[code] ?? category.color,
                  } as CSSProperties
                }
              >
                <div className={styles.cardHeading}>
                  <h3>{name}</h3>
                  <Icon
                    name={
                      category.key === "trojans"
                        ? "jupiter-trojans"
                        : category.key.replaceAll("_", "-")
                    }
                  />
                </div>
                <p className={styles.description}>
                  {t(`objects.types.${category.key}.description`)}
                </p>
                <label className={styles.toggle}>
                  <span data-active={!active}>{t("objects.hidden")}</span>
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label={name}
                    checked={active}
                    onChange={(event) =>
                      setEnabled(
                        event.target.checked
                          ? [...enabled, code]
                          : enabled.filter((item) => item !== code),
                      )
                    }
                  />
                  <span data-active={active}>{t("objects.visible")}</span>
                </label>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          className={`${styles.arrow} ${styles.previous}`}
          onClick={() => scroll(-1)}
          aria-label={t("wizard.button_group.previous")}
        >
          <Icon name="chevron-left" />
        </button>
        <button
          type="button"
          className={`${styles.arrow} ${styles.next}`}
          onClick={() => scroll(1)}
          aria-label={t("wizard.button_group.next")}
        >
          <Icon name="chevron-right" />
        </button>
      </div>
      </div>
    </dialog>
  );
}
