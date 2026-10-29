# Toolbar

The primary explorer toolbar. Ported from the legacy Eleventy app.

The legacy queried its links by a data attribute, bound click handlers manually,
and kept active state in sync by adding and removing a class from the outside.
Here the open panel is a value in the URL, so the active state is **derived
rather than maintained**.

Objects and Guided Experiences are real navigation; filters and search toggle
panels.

## It is a panel, not a row of floating icons

Without the panel behind them the labels sit straight on the particle field
and stop being readable. The legacy site — the Eleventy app as deployed in
October 2026 — has always had the panel, and it is top-left from `medium` up,
as the legacy places it — an
earlier pass of the port had it centred against the viewport height instead.

The wordmark's slot is deliberately empty: the mark itself is positioned by
the chrome, not here. The slot is only the space it sits in, plus the rule
under it that makes the mark and the rail read as one panel.

The edge is `gradient_border` — a masked 1px border, brighter at the top.

On narrow viewports the toolbar becomes a bottom bar spanning the width,
keeping the glass.

## The panel is a sibling, not a child

So `aria-expanded` plus `aria-controls` is the correct relationship to
express, rather than nesting.

## The dot on Tours

The legacy marks Tours with a static dot: an 8px `--color-red-medium` dot in
the icon's top-right corner. It is a "there is something here" flag on the
feature, **not an unread count**, so there is no state behind it.

## The active item

A filled box and nothing else. The legacy site leaves the border transparent on the
active item, and this was the only teal-bordered control in the rail.

## Walkthrough

Several items carry spotlight targets for the first-run walkthrough; see
`organisms/Wizard`.
