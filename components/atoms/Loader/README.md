# Loader

The full-screen loading state, ported from the legacy Eleventy app, where it
was spread across a stylesheet, a template's inline SVG and a layer script.
The three had to be read as one: the stylesheet sized and placed the mark, and
the gsap timelines in the script were what made it a loader rather than a
logo.

## Why it is branded rather than a progress line

Because of what it is covering. The MPC dataset runs from 6 MB to 360 MB and
is served uncompressed (`lib/solar/quality.ts`), so on the heavier tiers this
is on screen for a while. The legacy never showed a bare bar: it put the
turning orbit mark over a blurred view of the scene, which is a wait a reader
can sit through.

The overlay is **translucent over a blur, not an opaque fill**. The scene is
already rendering the planets behind it and the legacy lets that show through.
Clicks are blocked, as they are there — there is nothing in the scene to hit
until the dataset lands.

## The percentage is the port's own addition

Nothing in the legacy knew the size of the download, so it had no counterpart.
It is worth keeping for the same reason the mark is — a 360 MB fetch with no
readout looks stalled — so it rides along under the copy rather than replacing
it.

## The mark is inline SVG, not an `<img>`

`OrbitMark` is inline because the animation addresses the individual glyphs.
The legacy ran two gsap timelines over it, one rotating the whole mark
and one staggering the glyphs' opacity, and neither reaches inside an external
image.

The fifteen glyphs are drawn flat in `--color-turquoise-400`; the legacy
hard-coded `#009fa1` on every path, which is that token's value.

## The gsap timelines as CSS

- `Loader.show()` tweened the overlay's opacity over 0.8s on `power1.in`.
- The entrance **animates `scale` and `rotate`, not two `transform`s.** Two
  `transform` animations overwrite one another, and the entrance tween and the
  continuous turn have to run together.
- The glyphs are 0.04s apart, which is `stagger` in the second timeline.
- One cycle of that timeline: every glyph fades up over 0.6s on `power3.out`,
  holds, then fades out over 1s on `power2.out`, repeating — 2.66s end to end.

**One departure.** In the legacy the fade-_out_ is simultaneous for every
glyph, since gsap staggered only the first tween. A single CSS animation cannot
stagger one half of its own keyframes, so the exit inherits the 0.56s spread of
the entrance. At this speed it reads as the same breathing mark.

Without any of the animation the mark still holds, drawn in full, so
reduced-motion loses nothing but the motion.

## Measurements

- The gap between mark and copy is a literal 400px/24px, as in the legacy,
  where it is wider than any margin token.
- The copy is set at the legacy's medium body size, unbolded.
