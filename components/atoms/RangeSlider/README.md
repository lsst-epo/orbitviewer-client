# Range slider

Two handles over a range, used by the filters panel.

It replaces the legacy's own slider — 428 lines of hand-rolled pointer
handling — with epo-react-lib's `HorizontalSlider`, and the wrapper exists
mainly to absorb a defect in that component's types: `HorizontalSliderProps`
is declared `Pick<ReactSliderProps, …>` rather than `Partial<Pick<…>>`, so
`className`, `ariaValuetext`, `defaultValue`, `marks`, `orientation` and `step`
are all typed as required even though they are optional in practice. Supplying
the library's own defaults here keeps that noise in one file instead of at
every call site. The change callback's parameter is inferred as `any` from the
same types, so it is annotated rather than left implicit.

## It is themed, not overridden

epo-react-lib's `HorizontalSlider` ships in a light theme — an 18px rail that
is mostly white border, with a grey knob — and no prop switches it to this
app's palette (`styleAs="dark"` only swaps white for near-white). But it does
expose a full set of custom properties, and almost all of the legacy's styling
goes through them:

| property                                                                                                   | what it reaches                  |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `--size-height-slider` / `--size-border-slider`                                                            | the rail's height and its border |
| `--color-background-slider` / `--color-box-shadow`                                                         | the rail's own fill              |
| `--size-height-track` / `--color-background-track-override`                                                | the span between the handles     |
| `--size-height-thumb` / `--color-background-thumb` / `--color-border-thumb`                                | the handle                       |
| `--color-background-thumb-label` / `--color-border-slider` / `--color-text-slider` / `--size-offset-label` | the chip over the handle         |

Only two things need a declaration: the handle's ring is 3px where the
component hard-codes 1px, and the rail is a gradient where the property takes
a flat colour.

**`--color-background-track` is a trap.** The component writes it _inline on
the element itself_, defaulting to `var(--color-background-track-override,
#313333)`, so a stylesheet rule on that element never wins. Set the override.

Where a declaration is unavoidable, double the selector (`.x.x`):
styled-components injects at runtime, after this stylesheet, and wins at equal
specificity.

## The rail is painted dark between the handles, not light

The legacy draws the full-width track as a turquoise gradient and fills the
selected span with turquoise-700 _over_ it. At full range that fill covers
everything, which is why the legacy site — the Eleventy app as deployed in
October 2026 — reads as a plain dark teal bar until a handle is moved.

## The chip over the handle

There is one chip **over each handle**, which is where the legacy floats it,
rather than a single combined readout above the control. It appears on hover,
focus and drag only, as the legacy's does.

The library reveals it on the handle's own `:focus`, but react-slider puts the
tabindex on a wrapper _around_ that element, so focus never reaches it and a
keyboard user moves the handle blind. `:focus-within` on the wrapper fixes it.
The legacy site has the same gap and does not fix it — its handles are not
focusable at all.

The chip sits **above** the handle, as the legacy has it. The library
drops it below, where the bounds row already is.

It reads the **range the control spans**, not its current value — that is what
the handles carry. The bounds row under the track is likewise decorative: each
handle already reports `aria-valuemin` and `aria-valuemax`.

## Measurements

Ported from the legacy:

- 24px between the label row and the control — a literal, not a margin token. The control and its bounds are 2px apart,
  which is the legacy's own gap.
- The label is small and uppercased. This is one of the few labels the
  legacy really does set in caps; the casing runs both ways between the two
  apps, so this one _gains_ uppercase where others lose it.
- The rail is 4px, and transparent — the gradient is painted on a
  pseudo-element below it. `clip-path` is not wanted here, but the thumbs are
  children of this element and a gradient background would sit under them
  either way.
- The handle is 20px of turquoise-600 inside a turquoise-200 ring.
- **The control is 2.5rem tall, and that figure is load-bearing.**
  The legacy centres the 4px rail in it so the handles have room
  above and below and the bounds row clears them. Without it the labels sit
  under the handles. The library reserves space _below_ for its own label;
  ours is above.
