// next/font/google exports fonts under their exact family name, so the
// identifier cannot be renamed at the import site.
// eslint-disable-next-line camelcase
import { Source_Sans_3 } from "next/font/google";

/** No `weight`, so the whole 200-900 variable range ships -- see README. */
export const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-source-sans-3",
});
