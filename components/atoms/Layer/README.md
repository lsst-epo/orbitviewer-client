# Layer

A dismissible panel over the explorer, replacing the legacy's own panel layer —
which imperatively toggled `aria-hidden`, added open/close classes, awaited a
hardcoded animation duration and attached a global `document.onclick` handler.
In React the open state is a prop and the transition is CSS, so only the
dismissal behaviour needs real logic.

Two legacy faults are fixed here: it assigned `document.onclick` directly, so
any two open layers clobbered each other's handler (this uses
`addEventListener` with cleanup), and it had no keyboard dismissal at all
(Escape closes).

## A control that owns the panel is not "outside" it

Pressing Objects, Filters or Search while that panel was already open replayed
its entrance animation instead of closing it. `togglePanel` was correct all
along — **the dismissal was racing it**:

1. `pointerdown` → the outside-click handler fires → panel closes
2. `click` → `togglePanel` sees no panel open → panel reopens

Close then open, in a single press, which looks exactly like a stuck button.

`controlsThisPanel` exempts any control that declares the panel in
`aria-controls`. Resolved through that attribute rather than a new prop, so any
control already declaring the relationship gets it for free and one that does
not still dismisses. Note the id may name a **wrapper** around the panel rather
than the panel itself, which is the case here — so containment is what is
tested, not identity.

### Testing note

**A synthetic `element.click()` never reproduces this.** The bug needs the
`pointerdown` that a real press sends first, and `.click()` dispatches only the
click, so the first probe showed a clean toggle and looked like the report was
wrong.

More generally: when a UI bug involves dismiss-on-outside-click, drag or focus,
reproduce it with real pointer input. Synthetic events skip the very events
those features listen to, and synthetic `PointerEvent`s with an arbitrary
`pointerId` make `setPointerCapture` throw — which produced a separate
false negative in `MapControls`.

## Closing and reopening in one press

Two behaviours exist only to stop the panel fighting the press that opened it:

- The outside-click handler is **attached a frame late**. Without that, the
  very click that opened the panel is still propagating and would immediately
  close it again.
- The closed panel is made **inert** — out of the tab order and out of the
  accessibility tree — while staying mounted, so the CSS transition can still
  play it out.

## The four placements

`side` is not a decoration; each value is a different legacy component.

- **`left` / `right`** are full-height drawers bled to that edge. Docking the
  object detail to the opposite edge from a toolbar panel is what lets the two
  be open together without overlapping.
- **`dock`** is the object detail's floating card: left-anchored, inset below
  the header, every corner rounded, over a scene that stays live and
  interactive around it. The legacy insets it below the header at its `medium`
  breakpoint and caps it at 620px. Unlike the drawers it is not full-bleed to
  an edge.
- **`card`** is the filters panel's: a small floating panel near the top left,
  as tall as its contents. The legacy places it at a literal
  `top: 170px; left: 128px` with `width: 384px` and no height at all. Those
  are literals there, so they are rem at base 16 here and scale with the root
  font, which is what the legacy site — the Eleventy app as deployed in
  October 2026 — does. It **fades and lifts** rather than
  sliding in from the edge: `filtersIn` is 0.3s of opacity and `filtersBodyIn`
  an 8px rise.

### The dock's width needs both terms

Two constraints, and which one binds depends on the viewport. The legacy puts
the card in a `grid-template-columns: 40vw 1fr` column and sets
`width: calc(100% - site-margin-small); max-width: 620px` against it — so the
column binds on a laptop (456px at 1200px wide) and the 620px cap only takes
over past ~1700px.

Both are expressed directly here, because **the port has no such grid to
measure `100%` against**. Drop the `40vw` term and the card is half the
viewport wide where the legacy site's is a third.

Closing it clears its own left margin as well as its width, so nothing of the
card is left peeking at the edge.

## The objects takeover

`size="full"` is the whole viewport, dimmed and blurred, with the scene still
showing through. On the legacy site the takeover is `inset: 0` over
`--color-backdrop` with the same blur every other panel uses — **not a slab**,
which is what the port had.

It fades rather than slides, so the transform is cancelled and the cards do the
moving (see `molecules/Objects`).

Its z-index is `--z-objects`, below the menu and the panels that sit beside the
toolbar: the takeover covers the scene, not the chrome above it. And it keeps
the whole screen, toolbar included — it replaces the toolbar with the back pill
rather than sitting beside it.

## Who owns the padding

- A **drawer's** padding comes from the body rather than the panel, because the
  card is the scrolling element — top padding on the panel would scroll away.
- The **takeover** contributes none of its own: it lays itself out against the
  full viewport, the rail's own inset clears the toolbar, and the controls are
  pinned to the edges.
- A panel with **no header** clears the navigation itself, and only on the
  right — that is the corner the share button and the menu occupy.

The drawers are offset by the toolbar so it stays visible and usable while a
panel is open. The legacy's `Toolbar.updateActiveStates()` kept its active
states in sync with the open layers, which only makes sense if the toolbar
remains on screen.

**There is no close button on the desktop filters card.** The legacy hides the
card's header at `medium`; the panel is dismissed by its toolbar item, a click
outside, or Escape.

## On a phone

- The toolbar becomes a bottom bar, so a panel takes the full width and leaves
  room for it below.
- `wide` means nothing there — the panel is already full width, and it keeps
  the full height it would have had.
- Neither floating variant floats: the legacy sends the card back to
  `inset: 0` below `medium`, close button and all, and the dock drops the same
  insets and fills the width.

## Sizing

`wide` is for a panel whose content is a row rather than a column — the objects
rail shows one card at a time in the default width. It is only as tall as it
needs to be, so the scene stays visible below it as well as beside it, which is
the point of the extra width; it also keeps the panel off the time machine,
which a full-height drawer this wide would bury.

That height is bounded by the time machine. Layout caps that
must clear a fixed element belong in **viewport units, not rem** — epo-react-lib
sets `html { font-size: var(--size-font-16-20) }`, a fluid scale, so `1rem` is
20px at desktop width and a `34rem` cap resolved to 680px rather than the 544px
intended.

## Two ways out is clutter

`showClose` suppresses the header's close button for content that provides its
own. On the right-hand side that button also sits underneath the navigation.

`closeLabel` is a prop because the legacy left this control untranslated.
