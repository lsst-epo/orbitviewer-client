# Wizard

The first-run walkthrough: spotlights each part of the interface in turn.
Ported from the legacy Eleventy app. All five of the legacy's steps are here,
in its order.

Steps target elements by a `data-wizard-step` attribute, as the legacy did, so
the chrome stays unaware of the wizard.

## The cut-out is four panels, not a box-shadow

The legacy darkened everything with one large `box-shadow` around the spotlit
element. That **still swallows pointer events over the very element it is
meant to be revealing** — the shadow is part of the overlay's own box.

Four shades around the hole leave the hole genuinely open. The overlay itself
catches nothing; the shades do the blocking.

## It re-measures on resize, not only on step change

The toolbar moves to the bottom below 768px. The legacy's `ResizeObserver`
watched only the target element, so a layout change that **moved** it without
resizing it was missed and the spotlight stayed where the element used to be.

## The card flips to the opposite side

Applied when the spotlight is in the lower half of the viewport, so the card
never covers the thing it is describing. The legacy pinned it to the bottom and
sat on top of the time machine for that whole step.

## Dismissal

`wizardSkipped` in `localStorage`. A write failure is non-fatal — the
walkthrough will simply be offered again next time, which is better than
failing the first visit over a storage quota.

## Styling notes

The primary action is the legacy's primary button:
a turquoise-600 fill with a turquoise-100 label — the same inversion the splash
and tour-player buttons had.
