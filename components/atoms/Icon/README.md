# Icon

A thin wrapper over epo-react-lib's `IconComposer` that registers this
project's own glyphs, so no call site has to pass them through.

The legacy's icon sprite was 265 lines of inline SVG. Most of it has direct
equivalents in the library, so only the domain-specific marks are ported and
`./icons` stays as small as possible.

## What comes from where

`ICONS` is the single lookup. Search, menu, play, pause, close, info, language,
fullscreen, check and the chevrons resolve to the library's own set; `./icons`
holds the rest — orbit, filters, guides, settings, fullscreen-off, and the
eight object-category glyphs.

The category glyphs are ported rather than substituted because they are the
visual key for the whole catalogue: the same mark appears on an object's chip,
on its row in the objects list, and on its category toggle. A near-miss in one
of those places would read as a different category.

## Three library names that are not the obvious ones

- **`ChevronThin` for the chevrons**, not the `*Elongated` pair the port first
  used. Those are drawn in a 6.9×21.9 viewBox — a mark three times taller than
  it is wide — where the legacy's `chevron-left` is the compact Material glyph
  in a 24×24 box. `Chevron` is the right box but far too heavy: a 3.6-unit
  stroke against the legacy's 1.4.
- **`ArrowUpFromBracket` for `upload`**, which is the tray-and-arrow the legacy
  puts on SHARE. The library's `share` is the three-nodes glyph, a different
  mark entirely.
- **`Recenter` is ours**, from `./icons`. It is a crosshair — Material's
  `gps_not_fixed`. The library's nearest candidate, `RotateLeftWithCenter`, is
  a circling arrow that reads as "undo" rather than "frame the system again".

## Icons that face one way only

`ChevronThin` has no right-facing twin, so `FLIPPED` reuses the same mark
turned around.

The rotation is a **class, not a `style` prop**: the library's icon components
accept `className`, `size` and `fill` and silently drop anything else.
