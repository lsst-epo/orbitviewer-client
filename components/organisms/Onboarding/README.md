# Onboarding

First run: pick a quality tier, then optionally pick a tour. Ported from the
legacy Eleventy app.

## The explorer decides when to show it, not the splash

The legacy hung this off the splash's start button, which meant the splash had
to know about the viewer's state. Here the splash simply links to `/explorer`
and the explorer decides for itself whether this is a first visit — shown when
no tier has been chosen before.

## The download size is on each card

The legacy showed only an object count, so the difference between the tiers —
6 MB against 106 MB — was invisible at the moment of choosing, which is the one
moment it matters.

## The benchmark runs while the reader is reading

So the recommendation is ready by the time they look for it. The legacy showed
a loader and made them wait two seconds before the dialog appeared at all.

## Styling notes

**There are exactly four tiers, so the tier picker's breakpoints are
explicit.** `auto-fit` settled on three columns and left the fourth stranded on
its own row.

The primary action is the legacy's primary button: a turquoise-600 fill with a
turquoise-100 label — the same inversion the splash and tour-player buttons
had.
