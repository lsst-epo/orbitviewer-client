# About

Five sections — masthead, introduction, the quality-tier showcase, the
observatory, and credits. Ported from the legacy Eleventy app.

## Entrance animations are pure CSS

The legacy drove them from an `IntersectionObserver` that toggled
`intersect_active` / `intersect_no-active` on every section, and re-ran them
each time a section left and re-entered the viewport.

`animation-timeline: view()` does the same with no observer and no per-scroll
class churn. Where the timeline is unsupported the sections are simply
visible, which is the right fallback.

## The device showcase

`DeviceTabs`, ported from the legacy's about carousel. Each tier gets a
screenshot inside a mask whose aspect ratio stands for the device it suits —
an ultrawide desktop down to a phone held upright, from the legacy's own set
of ratios — and an object count that
counts up to the new figure when the tier changes.

The ratio is the thing worth animating, since it is what actually changes
between tiers; the legacy swapped a class and let the same transition run.

### It is a real tablist

The legacy had `role="tab"` buttons with **no `tablist` parent, no
`tabpanel`, and no keyboard handling**, so the roles described a widget that
did not exist.

This is the APG pattern: only the selected tab is in the tab order, and arrow
keys move between them.

### Rotation stops when the reader takes over

The legacy rotated every three seconds and only ever stopped when scrolled out
of view, with no way to halt it — a WCAG 2.2.2 failure.

Here it stops **for good** on the first interaction, rather than moving the
panel out from under someone a few seconds later. Hover and focus pause it and
leaving resumes, unless a tier has already been picked, and it does not start
at all under `prefers-reduced-motion`.

### The counting figure

Craft authors these as free text (`"500,000 objects"`), so `splitCount` finds
the numeral rather than assuming it. If there is nothing to find, the string
is shown as written and the animation is skipped — the legacy read its figures
from a second source, the copy file, which could disagree with the CMS.

Group separators are only inserted between digits, so a trailing separator, or
the space before "objects", stays in the suffix rather than being eaten.

The count eases out, so the figure settles rather than stopping dead.

**The figure on screen is held in a ref as well as in state**, so the next
animation can start from wherever the last one got to without the effect
closing over `shown`. A closure there is fixed at the render that created the
effect; by the time it is read the figure has moved on, so the animation
starts from the wrong number and sometimes concludes it has nothing to do.

## Type scale

The legacy's type scale **steps at breakpoints rather than interpolating**, so
these are `@media` steps and not the `clamp()` an earlier pass of the port
used. Sizes are its `$font-styles` px over 16: body-large 18/24, subtitle-large
24/32, headline 32/40, hero 48/60 — every one of them `regular`.
