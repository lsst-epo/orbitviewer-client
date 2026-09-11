import Filters from "./Filters";
import Guides from "./Guides";
import Orbit from "./Orbit";
import Settings from "./Settings";
import FullscreenOff from "./FullscreenOff";
import Recenter from "./Recenter";
import PlanetsMoons from "./PlanetsMoons";
import Asteroids from "./Asteroids";
import NearEarthObjects from "./NearEarthObjects";
import Comets from "./Comets";
import Centaurs from "./Centaurs";
import TransNeptunianObjects from "./TransNeptunianObjects";
import InterstellarObjects from "./InterstellarObjects";
import JupiterTrojans from "./JupiterTrojans";

/**
 * Domain icons the legacy sprite provided and epo-react-lib does not.
 *
 * Everything else -- search, menu, play, pause, close, chevrons, info,
 * language, fullscreen -- routes to the library's own set, so this stays as
 * small as possible rather than re-porting the whole 265-line sprite.
 *
 * The eight object-category glyphs are here because they are the visual key
 * for the whole catalogue: they mark the chip on an object, the rows in the
 * objects list, and the category toggles.
 */
export const customIcons = {
  Filters,
  Guides,
  Orbit,
  Settings,
  FullscreenOff,
  Recenter,
  PlanetsMoons,
  Asteroids,
  NearEarthObjects,
  Comets,
  Centaurs,
  TransNeptunianObjects,
  InterstellarObjects,
  JupiterTrojans,
};
