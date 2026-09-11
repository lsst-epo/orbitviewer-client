import Filters from "./Filters";
import Guides from "./Guides";
import Orbit from "./Orbit";
import Settings from "./Settings";
import FullscreenOff from "./FullscreenOff";

/**
 * Domain icons the legacy sprite provided and epo-react-lib does not.
 *
 * Everything else -- search, menu, play, pause, close, chevrons, info,
 * language, fullscreen -- routes to the library's own set, so this stays as
 * small as possible rather than re-porting the whole 265-line sprite.
 */
export const customIcons = {
  Filters,
  Guides,
  Orbit,
  Settings,
  FullscreenOff,
};
