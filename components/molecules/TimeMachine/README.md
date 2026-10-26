# Time machine

The date readout, the Live toggle and the simulation-rate slider. Ported from
the legacy Eleventy app.

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

The legacy's slider was a hand-rolled thumb with document-level mouse, touch
and keydown listeners. Two defects went with it:

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
replaces it with the legacy's teal rail.

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

## The date field

`flatpickr` is **not carried over**. A native `datetime-local` gives the same
calendar and time entry with no dependency, works on touch, and is already
keyboard accessible; the legacy's Apply / Cancel / Live footer was three
buttons appended to flatpickr's DOM by hand on every open.

It is not, however, formattable: a `datetime-local` renders in whatever format
the browser chooses. So the field carries **both** — the input, which is the
real control and the only thing focus and assistive technology reach, and a
formatted string painted over it that steps aside the moment the input is
focused.

The two share one grid cell, so the string sits over the control rather than
beside it. Only the browser's _ink_ is hidden: the control itself stays where
it is, takes the click, and comes back as soon as it has focus and the
segments need to be visible to type into. The overlay takes no pointer events,
so a click reaches the control underneath.

The format is flatpickr's `M j, Y H:i:S`, taken from the legacy, and it is
what the legacy site — the Eleventy app as deployed in October 2026 — prints:
`Nov 11, 2026 12:25:07`, uppercased in CSS as the legacy does it. It needs **two `Intl` formatters, not one** —
a single call joins the date and the time with a locale separator (a comma in
`en`) that the legacy's format string does not have.

Parsing back, browsers may hand back seconds as well as minutes, so the parts
are matched rather than the string sliced at an assumed length.

### The draft

What the user is typing is held separately while they are typing it. A running
simulation would otherwise overwrite each segment as it was entered — the
legacy guarded against the same thing with `if (this.flat.isOpen) return`.

The draft stays empty until every segment is filled in, so a half-typed date
commits nothing.

### The calendar button

The native indicator is hidden in CSS and replaced by our own, so the
affordance survives the formatted overlay and can sit where the legacy puts
it, taking the same styling as every other control in the row.

`showPicker` is the only way to open that calendar from script, and it
**throws rather than no-ops** where it is unavailable.

## The timezone button

The clock reads in the viewer's own timezone by default, which is what
the legacy site shows — the legacy left flatpickr in local time and never said
which it meant.

Saying which it means is the one thing worth adding, so the zone is a button:
it prints the zone in force and switches to the other. **Only the display
changes.** The simulation's date-to-MJD conversion is UTC-based throughout and
never sees this.

## What reaches the URL

The date is written **only on an explicit change**. Mirroring the clock every
tick would rewrite history sixty times a second and leave a share link
pointing at an arbitrary instant mid-scrub.

The rate is rounded for the URL only. The cubic curve produces values like
`18.741607666015625`, and that precision is neither meaningful nor wanted in a
link — it is finer than one step of the slider.

The slider re-syncs to the rate only when the two no longer match, so an
external change (Live, a share link) moves the thumb and the user's own drag
does not fight it.

## Live is a toggle that is already on

Rather than a disabled control. The legacy disabled the checkbox while live,
which removes it from the tab order and leaves its state unannounced.

## The play button's ring

The legacy's large spinner: a dim full ring with one bright quarter turning
over it, **not** a ring with a brighter side. Both are 1px in turquoise-500;
the arc is the same circle masked to 90deg. Its period is tied to how fast the
simulation is running (`speedDuration`).

Paused is a play triangle on its own — the legacy drops the spinner's
border-width to 0 in its `resume` state.

## The sliding hints

The legacy's sliding hints: chevrons pulsing either side of the thumb, which is how the
legacy says the control is draggable. `--position` is the slider's own `-1..1`,
mapped over the same `width - 20px` travel the thumb uses, so the pair rides
along with it.

They track `position` rather than sitting inside the thumb, which is the
library's element and takes no children. They therefore need a box that is the
rail's row and nothing else — the rail is that box's first pixels, since the
library puts it flush with the top and reserves the space below it for a label
the legacy floats above instead.

**Each chevron is placed by its own wrapper**, not by a transform on the icon.
The right-hand one is the left-hand glyph turned 180deg, and a `transform` on
the same element composes _inside_ that rotation — so `translateY(-50%)` would
move it down instead of up.

The label and the reading sit together. Apart — one flush left, the other
flush right — they read as two unrelated things rather than as a name and its
value. The raw position is meaningless either way, whether read aloud or shown
in the thumb's own bubble, so the **rate** is the value in both places.

The library puts its bubble below the thumb, where the panel has no room for
it; the legacy floats it above, which is where the stylesheet puts it back.

The library's own fill is suppressed: it fills from the minimum, which on a
signed rate would read as "half speed" at zero, and there is no prop to turn
it off.

The thumb is 20px of turquoise-600 inside a 3px turquoise-200 ring.
Horizontally this needs no correction — the library's travel already runs over
`width - 20px`, whatever size its theme then draws the thumb; measured, a 20px
knob lands on the rail's centre at position 0 and a 14px one does not.
Vertically it hangs 1.5px low against a 4px rail.

## Where the strip sits

Centred on the **viewport**, which means it is not centred on the space beside
the toolbar — the rail simply overlaps the left margin. That is the legacy
site's control strip, inset by `--site-margin-large` on three sides with the
controls laid out across it.

**The object detail dock, and only that, moves it.** The legacy site shifts
the whole control strip to `calc(1rem + 40vw)` while the detail is open, the
same column the dock itself is measured against. A filters or search panel does not
move it — measured on the legacy site, which leaves it centred — because those stop
short of the strip on their right edge.

On narrow viewports the toolbar is a bottom bar, so the panel sits above it
rather than over it; and a panel is full width there, so there is nowhere to
move to.

## Styling notes

- Ported from the legacy, flattened out of its nesting.
  The legacy's frozen-glass and gradient-border mixins become a backdrop filter and
  a plain border; the tokens they used are the same. A flat fill with a hard
  1px border reads as a dialog over the scene rather than part of the HUD.
- The legacy site overrides `--timemachine-width` (24rem, which is still what
  the legacy's source says) with **27.5rem** when the strip is in the scene.
  The override is what ships.
- The row inset is a literal 8px, as in the legacy rather than a
  margin token — the tokens double at `medium`, so a token here would put
  twice the inset on the row at every desktop width.
- The rail is the legacy's: 4px of turquoise, bright at both ends and
  dark in the middle, pinched at the centre by a `clip-path`. The shape says
  that the middle of the travel is real time and either end is fast.

## Hydration

Anything showing a time-dependent figure renders a placeholder until mounted
(`lib/hooks/useMounted`). The server and the client disagree about "now" by
construction, and React treats that as a hydration mismatch.
