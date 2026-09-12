"use client";

import type { FunctionComponent, SVGProps } from "react";
import IconComposer from "@rubin-epo/epo-react-lib/IconComposer";
import { customIcons } from "./icons";

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
  chevronLeft: "ChevronLeftElongated",
  chevronRight: "ChevronRightElongated",
  calendar: "Calendar",
  share: "ShareToggle",
  facebook: "ShareFacebook",
  x: "ShareTwitter",
  copy: "ShareCopyUrl",
  download: "ArrowUpFromBracket",
  help: "QuestionCircle",
  arrowLeft: "Chevron",
  zoomIn: "Plus",
  zoomOut: "Minus",
  recenter: "RotateLeftWithCenter",
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

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number | string;
}

const Icon: FunctionComponent<IconProps> = ({ name, size, ...props }) => (
  <IconComposer
    icon={ICONS[name]}
    customIcons={customIcons}
    size={size}
    {...props}
  />
);

export default Icon;
