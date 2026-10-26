# Object search

The search panel over the explorer, ported from the legacy Eleventy app.
Local matches appear as you type; the full catalogue is
only queried when asked, since that is a round trip against millions of rows.

Selecting a result opens it in the object detail, which is the same `object`
search param the legacy's `/object/?id=` route carried.

## The catalogue is offered only once local search comes up empty

This is how the legacy gates it: the cloud-search control is `aria-hidden`
until the local search returns nothing, and the not-found banner appears with
it.

Offering it alongside a full list of local matches would invite a round trip
against millions of rows that the reader almost never needs.

## The magnifier and the cloud button share one slot

`.inputActions` is the legacy's input-actions slot: a single slot at the
trailing edge of the field holding **either** the magnifier **or** the
cloud-search button, which swap rather than both being on screen at once.

`.input` reserves trailing room for whichever one is in it; the magnifier is
the narrower of the two, so the button sets the figure.

The button is `styleAs="primary"`, not `secondary`: epo-react-lib's secondary
is red, and its primary is `#12726d` — the same fill the legacy's own primary
button uses here.

## Results are announced, not focused

They appear below the field as you type, so the status line is wired up with
`aria-describedby` and announced politely rather than hijacking focus.

## The distance column is not always the same quantity

A result shows its semi-major axis, except on an unbound orbit, where it
shows perihelion instead. `a = q/(1-e)` flips sign past `e = 1`, so for the
210 hyperbolic objects in the low tier it is a negative number and not a
distance at all — the panel printed `-2765.49 AU` until this was fixed.

`ObjectDetail` makes exactly the same substitution, for the same reason, and
the two should stay in step.

The row is too narrow for a label, so the two cases are distinguished by the
`title` — reusing the strings the object detail already has, so nothing new
needs translating.
