// next/font/google exports fonts under their exact family name, so the
// identifier cannot be renamed at the import site.
// eslint-disable-next-line camelcase
import { Source_Sans_3 } from "next/font/google";

/**
 * Replaces the legacy `_fonts.scss`, which pulled Source Sans 3 over a
 * render-blocking Google Fonts @import. next/font self-hosts the files and
 * emits the @font-face rules at build time.
 */
/**
 * No `weight`, so next/font serves the variable font across its whole
 * 200-900 range -- which is what the legacy loaded. Pinned to 400 and 600 it
 * matched most of the interface but left every 900 to be synthesised: both
 * epo-react-lib and the legacy's own styles ask for black, and a faux-bold
 * 400 is visibly not Source Sans 3 Black.
 */
export const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-source-sans-3",
});
