"use client";

import type { FunctionComponent, SVGProps } from "react";
import IconComposer from "@rubin-epo/epo-react-lib/IconComposer";
import clsx from "clsx/lite";
import { customIcons } from "./icons";
import styles from "./styles.module.css";

/**
 * Icon lookup.
 *
 * Wraps epo-react-lib's IconComposer so every call site gets the project's
 * custom icons without passing them through. The legacy `icons.njk` was a
 * 265-line inline SVG sprite; most of its contents have direct equivalents in
 * the library, so only the domain-specific ones are ported.
 *
 * Legacy sprite id -> icon here:
 *   search, menu, play, pause, close, info, language, fullscreen, check,
 *   chevron-*  ->  library icons (Search, Hamburger, Play, ...)
 *   orbit, filters, guides, settings, fullscreen-off  ->  ./icons
 *   the eight object-category glyphs                ->  ./icons
 */

/** Legacy sprite ids mapped onto the library's names. */
export const ICONS = {
  search: "Search",
  menu: "Hamburger",
  play: "Play",
  pause: "Pause",
  close: "Close",
  info: "InfoCircle",
  language: "Globe",
  fullscreen: "Expand",
  check: "Checkmark",
  chevronDown: "CaretDown",
  chevronUp: "CaretUp",
  // `ChevronThin`, not the `*Elongated` pair the port had. Those are drawn
  // in a 6.9x21.9 viewBox -- a mark three times taller than it is wide,
  // where the legacy's `chevron-left` is the compact Material glyph in a
  // 24x24 box. `Chevron` is the right box but far too heavy (a 3.6-unit
  // stroke against the legacy's 1.4). There is no right-facing Thin, so the
  // right chevron is the same glyph turned around -- see `flipped`.
  chevronLeft: "ChevronThin",
  chevronRight: "ChevronThin",
  calendar: "Calendar",
  share: "ShareToggle",
  facebook: "ShareFacebook",
  x: "ShareTwitter",
  copy: "ShareCopyUrl",
  download: "ArrowUpFromBracket",
  // The tray-and-arrow the legacy uses on SHARE; `share` is the nodes glyph.
  upload: "ArrowUpFromBracket",
  help: "QuestionCircle",
  arrowLeft: "Chevron",
  zoomIn: "Plus",
  zoomOut: "Minus",
  recenter: "Recenter",
  // Custom, from ./icons
  orbit: "Orbit",
  filters: "Filters",
  guides: "Guides",
  settings: "Settings",
  fullscreenOff: "FullscreenOff",
  // Object categories
  "planets-moons": "PlanetsMoons",
  asteroids: "Asteroids",
  "near-earth-objects": "NearEarthObjects",
  comets: "Comets",
  centaurs: "Centaurs",
  "trans-neptunian-objects": "TransNeptunianObjects",
  "interstellar-objects": "InterstellarObjects",
  "jupiter-trojans": "JupiterTrojans",
} as const;

export type IconName = keyof typeof ICONS;

/** Icons drawn facing one way and reused for the other. */
const FLIPPED = new Set<IconName>(["chevronRight"]);

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number | string;
}

const Icon: FunctionComponent<IconProps> = ({
  name,
  size,
  className,
  ...props
}) => (
  <IconComposer
    icon={ICONS[name]}
    customIcons={customIcons}
    size={size}
    className={clsx(className, FLIPPED.has(name) && styles.flipped)}
    {...props}
  />
);

export default Icon;
