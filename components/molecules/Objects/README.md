# Objects panel

The category takeover: one card per object category, each with a name, icon,
description, count and a visibility switch. Ported from the legacy Eleventy
app.

The panel covers the whole viewport at `--z-objects`, so anything outside it
sits behind the scrim. Its back control therefore lives _inside_ the takeover,
where the legacy puts it, rather than floating over it — the
toolbar stands down while the panel is open, so this is the only way out.

Which categories are on lives in the `types` search param, so the selection is
shareable; see `visibleCategories` in the explorer context.

## The rail is the browser's, not ours

The legacy's 250-line `ObjectsScroller` — momentum easing on rAF, a global
non-passive wheel listener, a bespoke touch-pan class, snap points recomputed
from `getBoundingClientRect`, and an `onFocus` handler to scroll keyboard
users into view — is replaced by native CSS scroll-snap plus
`scrollBy({ behavior: "smooth" })`.

The browser then handles wheel, touch, keyboard and focus scrolling itself,
and the page wheel is no longer hijacked while the panel is open. Two
consequences worth knowing:

- **The rail needs no tab stop of its own.** Every card holds a switch, so
  tabbing through them walks the whole list and the browser scrolls each into
  view — which is what the legacy's `onFocus` handler was reimplementing.
- **Chevron state comes from the `scroll` event.** The legacy tracked it with
  a `'start' | 'middle' | 'end'` state machine driven from its animation loop;
  the event is enough, and fires however the user scrolls.

The scrollbar is hidden, as in the legacy: the chevrons and the drag are the
affordance, and a bar under a row of cards reads as a second control.

## The cards share one grid

`.track` is a grid rather than a flex row, and each card is `subgrid` across
the same three rows. A title that wraps to two lines therefore makes _every_
card's header taller rather than only its own, so the three bands line up
across the row.

The legacy sidesteps this by truncating titles to one line. Wrapping and
growing together is this port's call — hence `.name` wraps.

Descriptions vary by several lines. Because the row is one grid, every body is
already as tall as the longest; `.cardBody` scrolls only when the panel itself
is short, and fades at the bottom when it does (`scroll-mask` in the legacy).

## The entrance

Cards slide up one after another — `translateY: 105%` to 0 on `expo.inOut`
over 1.5s, 0.1s apart, which is the loop in `ObjectsFiltersPage`. They are not
staggered in place. The per-card delay comes from an `--index` custom property
written onto each `<li>` from the render; that is the only reason the index is
passed to the style attribute.

The heading, back control and chevrons rise together with them (`autoAlpha`
and `translateY: 100` on `cubic.inOut` over 1.2s).

Everything arrives at once under `prefers-reduced-motion: reduce`.

## Theming the library Switch

`Switch` is ported from the legacy's toggle group as the objects panel used
it: two static labels with the active one highlighted, around a toggle.

`.switchControl` themes epo-react-lib's `Switch` through its own custom
properties rather than overriding it selector by selector — the boundary this
port settled on for the library (see the Filters reset button).

Three things to know before touching it:

- **Property names are case-sensitive** and follow the library's own
  capitalisation: `--Switch-background-color`, `--Switch-Toggle-color`.
- **The selector is doubled** (`.switchControl.switchControl`) for the usual
  styled-components reason: the library injects at runtime, so at equal
  specificity it wins.
- **Its defaults are the light theme again** — a 90×49 pill in `#dce0e3` with
  a grey knob. The legacy's is 4rem × 2rem, grey-800 behind a 1px rule,
  with a turquoise-600 knob the full height of the track, hence
  `--toggle-margin: 0`.

The two labels either side are decorative (`aria-hidden`): they restate the
switch's states, which a screen reader already gets from `role="switch"` plus
`aria-checked`. The switch itself carries the category name, so it announces
as "Comets, switch, on" rather than the legacy's unnamed checkbox.

## Chevrons

Plain icon buttons, not epo-react-lib's `Button`, which is sized and coloured
for a text label; these match the panel's close control.

The strip is pinned to the viewport's edges and centred on the card row
(`inset: 50% var(--site-margin-small) auto` in the legacy), not tucked
into a corner. It takes no pointer events, so the cards behind it stay
draggable between the two buttons.

At each end the spent chevron goes to `opacity: 0` rather than being greyed —
the legacy fades them to nothing. `disabled` keeps the invisible one out of
the tab order.

## Counts

Planets are not in the MPC catalogue — they arrive from their own dataset — so
counting `elements` leaves that card with no figure at all, which reads as a
bug rather than as "none". `planets-moons` is counted separately from
`planets` and `dwarfPlanets`.

## What the named styles resolved to

The port maps the legacy's named styles onto plain declarations:

| Rule                | Resolves to                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `.back`             | the legacy's medium secondary button — bordered and 3rem, not the ghost pill other back links use |
| `.title`, `.name`   | its large subtitle, unbolded                                                                      |
| `.switchLabel`      | its medium body semibold, sentence case — the legacy's caps styles are used nowhere here          |
| `.control`          | its large secondary icon button — a 4.5rem glass circle, the biggest of the set                   |
| `.card`, `.control` | frozen glass with a gradient border, as every floating surface here                               |

Horizontal insets are `--toolbar-width` plus a margin throughout, which is
where the legacy starts the cards: the rail runs the full width of the
takeover and insets itself rather than being placed beside the toolbar. The
heading and back control use the same inset so they line up with the first
card.
