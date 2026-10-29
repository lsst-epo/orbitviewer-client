# How to Use

A masthead with an in-page table of contents, then one titled article per
Craft section. Ported from the legacy Eleventy app.

## Anchors are Craft block ids, not loop indices

The legacy used the loop index (`#section-0`). An index-based anchor changes
meaning whenever an editor reorders or inserts a section, so **every saved
link into the page would silently start pointing somewhere else**.

## Anchor scrolling is CSS

The legacy intercepted every table-of-contents click to scroll with
`document.body.scrollTo`, having to measure the navigation's height by hand to
offset it.

`scroll-margin-top` on the targets does that in CSS, and plain anchors then
work — including opening in a new tab, and arriving at the right place on
first load from a shared link, neither of which the intercepted version did.

## Images

Craft carries no alt text on the instructional images, and they are
instructional rather than decorative, so the section title at least identifies
what is being shown.

## Type scale

The legacy's type scale **steps at breakpoints rather than interpolating**, so
these are `@media` steps and not the `clamp()` an earlier pass of the port
used. Sizes are its `$font-styles` px over 16: body-large 18/24, subtitle-large
24/32, headline 32/40, hero 48/60 — every one of them `regular`.
