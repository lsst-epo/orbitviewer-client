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

epo-react-lib's `HorizontalSlider` replaces it. It is **not** a native range
input underneath — the thumb is a `div` with `role="slider"`, `tabindex` and
`aria-valuenow` — but it implements the pattern properly: arrow keys move it
(verified: three presses take `aria-valuenow` from 0 to 0.015), and the
handling is scoped to the focused thumb rather than bound to the document.

## It ships in a light theme, and its rail is mostly border

The component renders with `data-theme="light"` and no prop to change it, and
its rail is an 18px bar made of a 2px core inside an **8px white border**.
That white bar was the "white track" in the parity audit. The stylesheet
replaces it with `_rangeslider.scss`'s teal rail.

**These overrides are the long way round.** The component exposes a full set
of theme custom properties — `--size-height-slider`, `--size-height-track`,
`--size-height-thumb`, `--color-background-thumb`, `--color-border-thumb`,
`--color-background-track-override`, `--size-border-slider` and more, plus a
`styleAs="dark"` prop. `atoms/RangeSlider` uses them and needs only two
declarations. This file was written before they were found; it works and is
verified, so it has been left alone, but anyone touching it should reach for
the properties first.

Two things to know before touching these overrides:

- **Every selector is doubled** (`.slider.slider`). The component is
  styled-components, which injects at runtime and therefore after this
  stylesheet; at equal specificity the library wins, so a single class never
  takes.
- **The rail cannot carry the `clip-path`.** The thumb is the rail's child,
  and `clip-path` clips descendants — put the legacy's pinch on the rail
  element and the knob is clipped to a 4px sliver of itself. It goes on a
  pseudo-element, which is not an ancestor of anything.

## Hydration

Anything showing a time-dependent figure renders a placeholder until mounted
(`lib/hooks/useMounted`). The server and the client disagree about "now" by
construction, and React treats that as a hydration mismatch.
