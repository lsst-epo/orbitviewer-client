"use client";

import type { FunctionComponent, SVGProps } from "react";
import IconComposer from "@rubin-epo/epo-react-lib/IconComposer";
import clsx from "clsx/lite";
import { customIcons } from "./icons";
import styles from "./styles.module.css";

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
  // `ChevronThin`, not the `*Elongated` pair: those are a 6.9x21.9 viewBox,
  // and `Chevron` is far too heavy. See README.
  chevronLeft: "ChevronThin",
  chevronRight: "ChevronThin",
  calendar: "Calendar",
  share: "ShareToggle",
  facebook: "ShareFacebook",
  x: "ShareTwitter",
  copy: "ShareCopyUrl",
  download: "ArrowUpFromBracket",
  // The tray-and-arrow the legacy puts on SHARE; the library's `share` is the
  // nodes glyph.
  upload: "ArrowUpFromBracket",
  help: "QuestionCircle",
  arrowLeft: "Chevron",
  zoomIn: "Plus",
  zoomOut: "Minus",
  recenter: "Recenter",
  orbit: "Orbit",
  filters: "Filters",
  guides: "Guides",
  settings: "Settings",
  fullscreenOff: "FullscreenOff",
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
