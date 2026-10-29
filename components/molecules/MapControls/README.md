# Map controls

Recentre, zoom and fullscreen, over the scene. Ported from the legacy Eleventy
app — a vertical stack at the bottom right, clear of the time machine.

## Zoom is held, not stepped

As it was in the legacy: `attachUpDownActions` set `controls.zoom` on press
and cleared it on release, and the camera moved a little every frame in
between. It bound six listeners per button to do that; a **pointer capture**
covers the same ground, including the case the legacy handled with
`mouseleave` — dragging off the button while still held.

Things to know about that capture:

- **It is the only thing that catches a release off the button.** Every
  release path here is on the button itself — `pointerup`, `pointercancel`,
  `keyup`, `blur` — plus an unmount effect. There is no document-level
  listener, so without the capture a pointer that goes down on the button and
  up somewhere else would leave the camera travelling.
- It was wrapped in a `try`/`catch` until 2026-10-26. `setPointerCapture`
  throws only for a pointer id that is not active, which inside a
  `pointerdown` handler it always is; the one case that did throw was
  **synthetic `PointerEvent`s in testing**, and the empty catch was hiding the
  gap above rather than covering it. Reproduce pointer behaviour here with
  real input — see `atoms/Layer`'s testing note.
- **Keyboard sends no pointer events**, so a press there is a single step
  rather than a held state.
- The zoom must be released on `pointerup`, on cancel **and on unmount**.
  Anything that ends the press without one of those would leave the camera
  travelling on its own.

## Fullscreen state is read from the document

Not tracked locally: Escape leaves fullscreen without firing any click of
ours, so local state would go stale.

The control is one button that reports its state, rather than the legacy's
pair of buttons with one permanently `aria-hidden`.

## Styling notes

- The gap between buttons is a literal 8px, as in the legacy. The margin
  tokens double at `medium`, so a token here would space the stack twice as
  far apart as the legacy site's at every desktop width.
- The buttons are the legacy's small secondary icon button: the same
  frozen-glass circle
  as the navigation trigger, one size down. **Not** a bordered rounded square
  — the legacy has no rectangular buttons over the scene at all.
- The edge is the `gradient_border` mixin's masked 1px border, the same recipe
  as the navigation trigger and the toolbar; the tokens carry the gradients.
- Focus is a ring, which is how the legacy marks every one of these.
- Held zoom needs the press that drags off the button not to select text or
  start a browser gesture on the way, hence the touch/selection guards.
- The stack sits above the time machine, which is itself above the toolbar.
