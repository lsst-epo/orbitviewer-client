# Object detail

The panel for a selected body. Ported from the legacy Eleventy app, flattened
out of its deep SCSS nesting and with its font mixins replaced by the values
they resolved to.

The legacy had this as **two routes** — `/object/?id=` for catalogue objects
and `/solar-items/<slug>/` for the 45 Craft-authored ones — both of which are
now this one panel, driven by the `object` search param.

The two sources are complementary rather than exclusive: a Craft entry
supplies the copy (title, description, hero image, diameter) and the orbital
data supplies the figures. An object can have either or both. Where both offer
a colour, Craft is the source of truth and the category token is the fallback,
so a category Craft has not coloured still reads.

A shared link can name an object that is not in the loaded tier, or that never
existed. The panel says so, which beats the legacy's silent redirect home.

## Everything is "as of the shown date"

The figures are computed from the simulation clock, which the server cannot
know, so the panel renders a placeholder until mounted (`lib/hooks/useMounted`).

Two places where the legacy disagreed with itself and this does not:

- **Distance** is propagated to the shown date. The legacy printed the epoch
  value, which sat next to live distances and a live perihelion date and
  disagreed with both — Earth read 357.55 beside "113 days" to a perihelion
  that 357.55 puts two days away.
- **Days to perihelion** is measured from the simulated date. The legacy
  measured it from `new Date()` while showing a date computed from the
  simulated one, so the two drifted apart as soon as the time machine moved.

## The comparison bars

`Graph` is one bar, ported from the legacy's card graph. Two deliberate
changes from the legacy:

1. **The fill is linear across the range**, where the legacy ran the fraction
   through `MathUtils.smoothstep`. Smoothstep is an easing curve; applying it
   to a measurement misreports it — a value a quarter of the way along its
   range drew at 16%, and one three quarters along drew at 84%. The bar is the
   only quantitative comparison on the panel, so it should be linear.
2. **The range endpoints are labelled.** The legacy drew an icon at each end
   and left the actual bounds unstated, so the bar showed a position without a
   scale. Icons are still drawn when given.

The value bubble is centred on the thumb, so near either end it would hang
outside the panel. Past `EDGE_MARGIN` it aligns to the thumb instead of
straddling it. The track reserves headroom for it, or it would collide with
the label row. There is no separate detail slot: the bubble already reads the
figure, where the legacy's head slot repeated it.

### What the bars are scaled against

`orbitRange` gives the object's **own** perihelion-to-aphelion span.

The legacy drew "how far from the Sun today" against the semi-major axis range
for the whole category, which answers a different question — it says whether
the object is near or far compared with its peers, not where it is in its own
orbit. Its companion bar, distance from Earth, was worse: the range it scaled
against (`DistanceFromEarth`) was only ever populated for planets, so for any
asteroid or comet it was drawn against `Infinity`/`-Infinity`.

Perihelion to aphelion is the range the figure actually moves through, so the
bar reads as progress around the orbit. **Unbound orbits have no aphelion**,
so they get the figure without a bar.

Relatedly, semi-major axis is negative for an unbound orbit — `a = q/(1-e)`
flips sign past `e = 1` — so it is not a distance and cannot be compared
against one. Those objects show perihelion instead, which is the distance that
means something for them.

## Orbital elements

`OrbitalElement` puts each element's explanation behind an **info toggle**.

The legacy used a hover tooltip (`TooltipDialog`) that also opened on click and
then closed itself after two seconds. That is unreadable on touch and
unreachable by keyboard. This is a disclosure instead: the button toggles the
text, which stays up until dismissed, and `aria-expanded` / `aria-controls`
describe the relationship.

## The orbit toggle

Shown for every body. The legacy showed it only for planets, but every
selected body has an orbit worth seeing — and without it the path is drawn off
screen, since the camera frames the body itself.

Its label falls back to whatever the scene will actually do, or the toggle
reads "Object" while the camera frames the orbit.

## The back control

The only way out of a selection besides Escape. The legacy card had the same
control as its first element — a link, since each object was its own page —
and the panel's own close button would sit underneath the navigation on this
side.

It is the legacy's small ghost pill: no border at rest, one on hover. An earlier pass
of the port had a permanent outline, which reads as a form control rather than
as a way back.

## Styling notes

- Units are one titled block per figure, as in the legacy card.
- Labels are sentence case: the legacy reaches for its large body and regular
  caption here, never one of the caps styles.
- Descriptions are Craft-authored rich text, from our own CMS.
