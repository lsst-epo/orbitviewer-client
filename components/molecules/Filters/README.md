# Filters

Ported from the legacy Eleventy app. Two controls, matching the legacy: discovery
source, and a distance range in AU.

The legacy also had a date-range slider, but it was commented out there and is
not carried over. **Category toggles are deliberately absent** — in the legacy
those lived in the objects panel (`ObjectsFiltersPage`), not here.

Both values live in the URL, so a filtered view is shareable and survives a
reload. There is no Apply step: the legacy's Apply button only closed the
panel, since changes already applied live as the controls moved.

The slider's bounds come from Hasura's observed ranges, so it spans what the
catalogue actually contains rather than an arbitrary constant.

The panel's own shape — a floating card at the top left rather than a drawer —
is the Layer's `card` side; everything in this folder's stylesheet is what
sits inside it.

## The Reset button

epo-react-lib's `Button` themes itself by setting three custom properties
(`aButtonTheme` in `styles/mixins/appearance.js`) that its base mixin then
consumes. **Overriding those variables rather than the declarations is what
makes this work at all**: the mixin sets `color` with `!important`, so the
property itself cannot be overridden from here, but the variable behind it
can.

`tertiary` is the right shape — the legacy's Reset is a secondary button, a
bordered ghost rather than a fill — but the library draws it black-on-white
for a light page, which is invisible here. The alternative was `secondary`,
which in epo's vocabulary means **red**; that is what this button actually
rendered as whenever a filter was changed, reading grey only because
`isInactive` holds at the defaults.

Two further notes:

- **The class is doubled** to clear the styled-component's own specificity
  without depending on which stylesheet the bundler emits last.
- **Size does not go through the theme variables**, which do not reach it. The
  library's button is `0.81818em` bold in a 6px box padded with its own
  spacing tokens; the legacy's small secondary button is 2.5rem tall, 1rem
  semibold,
  `0 0.75rem`, rounded to `--corner-medium`. The two spacing tokens are epo's,
  so those go through variables; the rest are plain declarations, which land
  because the doubled class outruns a single styled-component class.
- The library greys the fill and border out to `--neutral40` when inactive,
  which puts a light-mode grey on a dark panel. The legacy just dims the ghost
  it already has, which is what the stylesheet does instead.

## Styling notes

- Field labels are `subtitle-large-regular`, the same size as the heading on
  the objects takeover — not a small bold caption.
- `filters_card_field`: 24px of air above and below, and a rule between
  consecutive fields rather than a gap. Both literals in the legacy.
