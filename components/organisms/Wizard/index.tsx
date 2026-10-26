"use client";

import {
  useCallback,
  useEffect,
  useId,
  useState,
  type CSSProperties,
  type FunctionComponent,
} from "react";
import clsx from "clsx/lite";
import useClientTranslation from "@/lib/i18n/client";
import Icon from "@/components/atoms/Icon";
import styles from "./styles.module.css";

const STORAGE_KEY = "wizardSkipped";

/** Padding around the spotlit element, in px. Ported from the legacy. */
const SPOTLIGHT_INSET = 6;

interface Step {
  /** Matches `data-wizard-step` in the chrome. */
  target: string;
  copyKey: string;
}

const STEPS: Array<Step> = [
  { target: "toolbar", copyKey: "wizard.content.toolbar" },
  { target: "timemachine", copyKey: "wizard.content.time_controls" },
  { target: "mapcontrols", copyKey: "wizard.content.map_controls" },
  { target: "navigation", copyKey: "wizard.content.share_menu" },
  { target: "tours", copyKey: "wizard.content.guides" },
];

interface Spotlight {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Whether the walkthrough has been dismissed before. */
export const wizardDismissed = (): boolean => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return true;
  }
};

const Wizard: FunctionComponent<{
  locale: string;
  onDismiss: () => void;
}> = ({ locale, onDismiss }) => {
  const { t } = useClientTranslation(locale);
  const titleId = useId();
  const bodyId = useId();

  const [index, setIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);

  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  const measure = useCallback(() => {
    const element = document.querySelector(
      `[data-wizard-step="${step.target}"]`
    );

    if (!element) {
      setSpotlight(null);
      return;
    }

    const rect = element.getBoundingClientRect();

    setSpotlight({
      top: rect.top - SPOTLIGHT_INSET,
      left: rect.left - SPOTLIGHT_INSET,
      width: rect.width + SPOTLIGHT_INSET * 2,
      height: rect.height + SPOTLIGHT_INSET * 2,
    });
  }, [step.target]);

  useEffect(() => {
    measure();

    // Re-measured on resize as well as on step change: the toolbar moves to the
    // bottom below 768px, and the legacy's ResizeObserver watched only the
    // element, so a layout change that moved it without resizing it was missed.
    window.addEventListener("resize", measure);

    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Non-fatal; it will just be offered again next time.
    }
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dismiss]);

  return (
    <div
      className={styles.wizard}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
    >
      {spotlight && (
        <>
          {/* Four panels around the cut-out rather than one box-shadow: the
              shadow approach the legacy used still swallows pointer events
              over the element it is meant to be revealing. */}
          <div
            className={styles.shade}
            style={
              {
                inset: `0 0 auto 0`,
                height: `${Math.max(spotlight.top, 0)}px`,
              } as CSSProperties
            }
          />
          <div
            className={styles.shade}
            style={
              {
                top: `${spotlight.top + spotlight.height}px`,
                right: 0,
                bottom: 0,
                left: 0,
              } as CSSProperties
            }
          />
          <div
            className={styles.shade}
            style={
              {
                top: `${spotlight.top}px`,
                left: 0,
                width: `${Math.max(spotlight.left, 0)}px`,
                height: `${spotlight.height}px`,
              } as CSSProperties
            }
          />
          <div
            className={styles.shade}
            style={
              {
                top: `${spotlight.top}px`,
                right: 0,
                left: `${spotlight.left + spotlight.width}px`,
                height: `${spotlight.height}px`,
              } as CSSProperties
            }
          />

          <div
            className={styles.ring}
            style={
              {
                top: `${spotlight.top}px`,
                left: `${spotlight.left}px`,
                width: `${spotlight.width}px`,
                height: `${spotlight.height}px`,
              } as CSSProperties
            }
            aria-hidden
          />
        </>
      )}

      <div
        className={clsx(
          styles.tooltip,
          spotlight &&
            spotlight.top + spotlight.height / 2 > window.innerHeight / 2 &&
            styles.tooltipTop
        )}
      >
        <div className={styles.head}>
          <h2 className={styles.title} id={titleId}>
            {t("wizard.title")}
          </h2>
          <p className={styles.steps} role="status">
            {index + 1}/{STEPS.length}
          </p>
        </div>

        <p className={styles.body} id={bodyId}>
          {t(step.copyKey)}
        </p>

        <div className={styles.foot}>
          <button type="button" className={styles.skip} onClick={dismiss}>
            {t("wizard.button_group.skip")}
          </button>

          <div
            className={styles.group}
            role="group"
            aria-label={t("wizard.button_group.aria")}
          >
            <button
              type="button"
              className={styles.ghost}
              onClick={() => setIndex((current) => current - 1)}
              disabled={index === 0}
            >
              <Icon name="chevronLeft" aria-hidden />
              <span>{t("wizard.button_group.previous")}</span>
            </button>

            <button
              type="button"
              className={styles.primary}
              onClick={() =>
                last ? dismiss() : setIndex((current) => current + 1)
              }
            >
              <span>
                {last
                  ? t("wizard.button_group.finish")
                  : t("wizard.button_group.next")}
              </span>
              {!last && <Icon name="chevronRight" aria-hidden />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wizard;
