# Layer

A dismissible panel over the explorer, replacing the legacy `layers/Layer.ts` —
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

## Sizing

The `wide` variant is bounded in height by the time machine. Layout caps that
must clear a fixed element belong in **viewport units, not rem** — epo-react-lib
sets `html { font-size: var(--size-font-16-20) }`, a fluid scale, so `1rem` is
20px at desktop width and a `34rem` cap resolved to 680px rather than the 544px
intended.
