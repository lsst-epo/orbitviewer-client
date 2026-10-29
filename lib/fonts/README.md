# Fonts

Replaces the legacy's font stylesheet, which pulled Source Sans 3 over a
render-blocking Google Fonts `@import`. `next/font` self-hosts the files and
emits the `@font-face` rules at build time.

## No `weight`, so the whole variable range ships

200–900, which is what the legacy loaded. Pinned to 400 and 600 it matched
most of the interface but left **every 900 to be synthesised** — both
epo-react-lib and the legacy's own styles ask for black, and a faux-bold 400
is visibly not Source Sans 3 Black.

The import identifier cannot be renamed: `next/font/google` exports fonts
under their exact family name, which is why the file disables `camelcase` on
that line.
