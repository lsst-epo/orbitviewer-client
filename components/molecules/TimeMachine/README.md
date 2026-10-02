# Time machine

The date readout, the Live toggle and the simulation-rate slider.

## The rate slider holds its own position

`SpeedSlider`'s domain is the **normalised position**, not the rate; the
mapping between them is cubic (`lib/solar/speed`).

That position is held in state rather than derived from the rate on every
render, **because the mapping is not injective.** Every position inside the
dead zone means zero hours per second, so a derived thumb gets pushed straight
back to the centre — one arrow-key press at a time it could never leave real
time at all, and a drag would snap back mid-gesture. The rate still wins when
it changes from outside, as when Live resets it.

## What the legacy slider got wrong

`SimpleSlider` was a hand-rolled thumb with document-level mouse, touch and
keydown listeners. Two defects went with it:

- dragging ran the pointer position through `smoothstep`, so the thumb did not
  track the cursor — it lagged, then overshot;
- its arrow-key handler was bound to `document` and gated on
  `document.activeElement`, so **every slider on the page responded to every
  keypress that reached the document**.

epo-react-lib's `HorizontalSlider` is a real range input underneath, so
keyboard, touch and pointer come for free and stay scoped to the focused
control.

## Hydration

Anything showing a time-dependent figure renders a placeholder until mounted
(`lib/hooks/useMounted`). The server and the client disagree about "now" by
construction, and React treats that as a hydration mismatch.
