# Sun magnetic field

The field lines arcing off the sun's surface, ported from the legacy Eleventy
app.

Field lines are arcs between two random points on the surface, bowed outward
along the surface normals: control points are lifted off along each normal,
with a shared midpoint pushed further out so the arc bows away from the sun.
Each arc is sampled into a few points, and **every sample becomes one
instance**; the vertex shader then displaces each instance through 4D curl
noise, so the arcs writhe rather than sitting still.

## The instance geometry is deliberately minuscule

`INSTANCE_RADIUS` is `1e-11` — the legacy's value. Each instance renders as
barely a speck, and that is correct: **the effect only reads as plasma after
the compositor's fire pass blurs it.** Anyone sizing these up by eye in the
main pass is tuning the wrong stage.

Which is also why this renders on `FIRE_LAYER` alone and never appears in the
main pass. See `components/scene/effects/composite/README.md`.

The anchors sit on geometry matching the sun's own, so they land on its
surface rather than near it.
