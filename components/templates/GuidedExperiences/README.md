# Guided experiences

The tour index, ported from the legacy Eleventy app.

The legacy rendered this as a layer — a panel over the 3D viewer. **It is a
page of its own here**: browsing a catalogue of tours has nothing to do with
the scene, and keeping the canvas alive behind it cost a WebGL context and a
running render loop for a list of cards. The scene comes back for the tour
itself, which needs it.

It is still a scrolling document inside the viewer shell, so it scrolls itself
and sits above the canvas rather than behind it — see
`components/templates/Viewer`. The scrim lets the scene read through, as the
legacy's does.

## Sorting and filtering operate on the array

The legacy did both by mutating the rendered cards rather than the list: it wrote an `--order` custom property onto each card and
let flexbox reorder them, and hid non-matching cards with `aria-hidden`.

Both are replaced by sorting and filtering the array, because the legacy
approach:

- left the **DOM order** — and so the tab and screen-reader order — unchanged
  and disagreeing with what was on screen; and
- put `aria-hidden` on a **link**, which removes it from the accessibility
  tree while leaving it focusable, stranding keyboard users on a control that
  announces nothing.

The legacy also rendered a hard-coded five-item suggestion menu under the
search box that was never wired to anything. It is not carried over; the grid
filters as you type, which is what it was miming.

A status line announces how the grid changed as the reader types, which the
legacy left entirely silent. The sort and search controls are identified by
icon and placeholder alone on screen, so both carry visually hidden labels.

## Cards must fill their list item

Otherwise cards in a row come out at different heights whenever their titles
wrap to a different number of lines — a 28px step, and very visible against
the card's border.

A grid item stretches to its row, but **the item here is the `li` that carries
the list semantics, not the card**: the card is its child, and a child does not
inherit that stretch. The legacy had no such wrapper — its card was the grid
item itself — so the question never arose. Making the `li` a grid
container of its own passes the stretch down.
