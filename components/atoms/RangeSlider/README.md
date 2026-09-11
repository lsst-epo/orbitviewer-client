# Range slider

Two handles over a range, used by the filters panel.

## It is themed, not overridden

epo-react-lib's `HorizontalSlider` ships in a light theme — an 18px rail that
is mostly white border, with a grey knob — and no prop switches it to this
app's palette (`styleAs="dark"` only swaps white for near-white). But it does
expose a full set of custom properties, and almost all of `_rangeslider.scss`
goes through them:

| property | what it reaches |
|---|---|
| `--size-height-slider` / `--size-border-slider` | the rail's height and its border |
| `--color-background-slider` / `--color-box-shadow` | the rail's own fill |
| `--size-height-track` / `--color-background-track-override` | the span between the handles |
| `--size-height-thumb` / `--color-background-thumb` / `--color-border-thumb` | the handle |
| `--color-background-thumb-label` / `--color-border-slider` / `--color-text-slider` / `--size-offset-label` | the chip over the handle |

Only two things need a declaration: the handle's ring is 3px where the
component hard-codes 1px, and the rail is a gradient where the property takes
a flat colour.

**`--color-background-track` is a trap.** The component writes it *inline on
the element itself*, defaulting to `var(--color-background-track-override,
#313333)`, so a stylesheet rule on that element never wins. Set the override.

Where a declaration is unavoidable, double the selector (`.x.x`):
styled-components injects at runtime, after this stylesheet, and wins at equal
specificity.

## The rail is painted dark between the handles, not light

`_rangeslider.scss` draws the full-width track as a turquoise gradient and
fills the selected span with turquoise-700 *over* it. At full range that fill
covers everything, which is why production reads as a plain dark teal bar
until a handle is moved.

## The chip over the handle

The library reveals it on the handle's own `:focus`, but react-slider puts the
tabindex on a wrapper *around* that element, so focus never reaches it and a
keyboard user moves the handle blind. `:focus-within` on the wrapper fixes it.
Production has the same gap and does not fix it — its handles are not
focusable at all.
