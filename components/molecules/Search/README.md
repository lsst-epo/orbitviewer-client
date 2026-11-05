# Object search

The search panel over the explorer, ported from the legacy Eleventy app.
Local matches appear as you type; the full catalogue is
only queried when asked, since that is a round trip against millions of rows.

Selecting a result opens it in the object detail, which is the same `object`
search param the legacy's `/object/?id=` route carried.

## The catalogue is always offered

The legacy gates this: its cloud-search control is `aria-hidden` until local
search returns nothing. This does not. The two sources cover different rows —
local matching sees only the tier that was downloaded — so a local hit is no
reason to withhold the catalogue, and the reader should not have to produce
an empty result to reach it.

The button is disabled only when it could not run: a query under
`MIN_QUERY_LENGTH`, or a request already in flight. It stays enabled after a
search returns, so the same query can be run again.

It reads `query` rather than the debounced value. The debounce paces local
matching as the reader types; an explicit press must search what is in the
field at that moment, or a click inside the 150ms window searches the
previous query.

## The input-actions slot

`.inputActions` is the legacy's input-actions slot at the trailing edge of
the field. The legacy swaps a magnifier and the cloud button through it; here
the button is always present, so the magnifier is gone and `.input` reserves
trailing room for the button alone.

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
