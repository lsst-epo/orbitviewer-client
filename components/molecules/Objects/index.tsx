"use client";

import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type FunctionComponent,
} from "react";
import useClientTranslation from "@/lib/i18n/client";
import { useExplorer } from "@/contexts/Explorer";
import { useSolarData } from "@/contexts/SolarData";
import { CATEGORY_LABELS, ALL_CATEGORIES } from "@/lib/solar/categoryLabels";
import { categoryColorMap } from "@/lib/solar/categoryColors";
import type { SolarCategory } from "@/lib/solar/types";
import Icon from "@/components/atoms/Icon";
import Switch from "./Switch";
import styles from "./styles.module.css";

/**
 * Objects panel -- which categories the scene draws.
 *
 * Ported from `pages/ObjectsFiltersPage.ts`, `components/ObjectsScroller.ts`
 * and `locale-templates/objects.njk`. One card per category: name, icon,
 * description, and a visibility switch.
 *
 * The legacy's 250-line `ObjectsScroller` -- momentum easing on rAF, a global
 * non-passive wheel listener, a bespoke touch-pan class, manual snap points
 * recomputed from getBoundingClientRect, and focus handling to scroll
 * keyboard users into view -- is replaced by native CSS scroll-snap plus
 * `scrollBy({ behavior: "smooth" })`. The browser then handles wheel, touch,
 * keyboard and focus scrolling itself, and the page wheel is no longer
 * hijacked while the panel is open.
 *
 * Which categories are on lives in the `types` search param, so the selection
 * is shareable; see `visibleCategories` in the explorer context.
 */

/** How much of the rail one press of a chevron moves, as a fraction. */
const PAGE_FRACTION = 0.8;

const ObjectsPanel: FunctionComponent<{ locale: string }> = ({ locale }) => {
  const { t } = useClientTranslation(locale);
  const {
    categories,
    visibleCategories,
    toggleCategory,
    closePanel,
    planets,
    dwarfPlanets,
  } = useExplorer();
  const { elements } = useSolarData();
  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const colors = categoryColorMap(categories);

  const counts = elements.reduce<Partial<Record<SolarCategory, number>>>(
    (totals, element) => {
      totals[element.category] = (totals[element.category] ?? 0) + 1;
      return totals;
    },
    {}
  );

  /**
   * Planets are not in the MPC catalogue -- they arrive from their own
   * dataset -- so counting `elements` leaves that one card with no figure at
   * all, which reads as a bug rather than as "none".
   */
  counts["planets-moons"] = planets.length + dwarfPlanets.length;

  /**
   * Chevrons are disabled at each end. The legacy tracked this with a
   * 'start' | 'middle' | 'end' state machine driven from its animation loop;
   * the scroll event is enough, and fires when the user scrolls by any means.
   */
  const onScroll = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    const max = rail.scrollWidth - rail.clientWidth;
    setAtStart(rail.scrollLeft <= 1);
    setAtEnd(max <= 1 || rail.scrollLeft >= max - 1);
  }, []);

  const page = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * rail.clientWidth * PAGE_FRACTION,
      behavior: "smooth",
    });
  };

  return (
    <div className={styles.objects}>
      {/* Inside the takeover, where `.layer-heading .actions` puts it, not
          floating over it: the panel covers the whole viewport at
          `--z-objects`, so anything outside it is behind the scrim. This is
          also the way out of the panel -- the toolbar stands down while it
          is open. */}
      <div className={styles.actions}>
        <button type="button" className={styles.back} onClick={closePanel}>
          <Icon name="chevronLeft" aria-hidden />
          <span>{t("core.back")}</span>
        </button>
      </div>

      <div className={styles.heading}>
        <h2 className={styles.title}>{t("objects.title")}</h2>
        <p className={styles.subtitle}>{t("objects.subtitle")}</p>
      </div>

      {/* The rail needs no tab stop of its own: every card holds a switch,
          so tabbing through them walks the whole list and the browser scrolls
          each into view. That is what the legacy's `onFocus` handler was
          reimplementing by hand. */}
      <div ref={railRef} className={styles.rail} onScroll={onScroll}>
        <ul className={styles.track}>
          {ALL_CATEGORIES.map((category, index) => {
            const label = CATEGORY_LABELS[category];
            const visible = visibleCategories.has(category);
            const count = counts[category];

            return (
              <li
                key={category}
                className={styles.item}
                // Drives the entrance stagger; see the stylesheet.
                style={{ "--index": index } as CSSProperties}
              >
                <div className={styles.card}>
                  <div
                    className={styles.cardLabel}
                    style={{
                      color: colors.get(category) ?? `var(--color-${category})`,
                    }}
                  >
                    <h3 className={styles.name}>{t(label.nameKey)}</h3>
                    <Icon name={label.icon} aria-hidden />
                  </div>

                  <div className={styles.cardBody}>
                    <p className={styles.description}>
                      {t(label.descriptionKey)}
                    </p>
                  </div>

                  <div className={styles.cardFoot}>
                    {count !== undefined && (
                      <p className={styles.count}>
                        {count.toLocaleString(locale)} {t("core.objects")}
                      </p>
                    )}
                    <Switch
                      checked={visible}
                      onChange={() => toggleCategory(category)}
                      label={t(label.nameKey)}
                      onLabel={t("objects.visible")}
                      offLabel={t("objects.hidden")}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Icon buttons rather than epo-react-lib's Button, which is sized and
          coloured for a text label. These match the panel's close control. */}
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.control}
          onClick={() => page(-1)}
          disabled={atStart}
          aria-label={t("objects.previous")}
        >
          <Icon name="chevronLeft" aria-hidden />
        </button>
        <button
          type="button"
          className={styles.control}
          onClick={() => page(1)}
          disabled={atEnd}
          aria-label={t("objects.next")}
        >
          <Icon name="chevronRight" aria-hidden />
        </button>
      </div>
    </div>
  );
};

export default ObjectsPanel;
