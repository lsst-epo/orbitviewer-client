// next/font/google exports fonts under their exact family name, so the
// identifier cannot be renamed at the import site.
// eslint-disable-next-line camelcase
import { Source_Sans_3 } from "next/font/google";

/**
 * Replaces the legacy `_fonts.scss`, which pulled Source Sans 3 over a
 * render-blocking Google Fonts @import. next/font self-hosts the files and
 * emits the @font-face rules at build time.
 */
export const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-source-sans-3",
});
