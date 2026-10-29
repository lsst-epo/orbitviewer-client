# Orbital paths

The traced orbit of a single body, ported from the legacy Eleventy app.
drei's `<Line>` wraps the same Line2/LineMaterial pair the legacy used
directly, which is what allows a real line width — native WebGL line width is
capped at 1px on most drivers.

Geometry is expensive to trace and does not change as the clock runs (the body
moves along a fixed ellipse), so it is memoised on the elements.

## Line width is in device pixels, not CSS pixels

`lineWidth` on `<Line>` is LineMaterial's `linewidth`, which the shader
converts to clip space by dividing by its `resolution` uniform — and **three
sets that uniform itself**, in `LineSegments2.onBeforeRender`, from the
device-pixel viewport. Neither codebase ever sets `resolution`, and neither
accounted for the consequence: the width is in device pixels, so the legacy's
`1` is a one-device-pixel hairline, half a CSS pixel on a 2x display.

These were briefly scaled by the pixel ratio to make the line a CSS pixel on
any display. That was wrong: it was measured while the whole scene was reaching
the canvas in linear colour at half brightness (see
`components/scene/effects/composite/README.md`), which was the real reason the paths
were hard to make out. With the encode restored, the legacy's width reads as
the legacy site's does, and doubling it makes the paths heavier than the thing
being matched.

## The desaturation is load-bearing

`glsl/lib/path/frag.glsl` is four-fifths dead code — the near-planet fade, the
glow write — wrapped around one live line:

```glsl
diffuseColor.rgb = generic_desaturate(diffuseColor.rgb, max(1.0 - opacity, .2));
```

It was missed on the first pass for exactly that reason. **Grep these legacy
shader files for what is _not_ commented out.**

Opacity drives it, so at the default 5% a path is pulled 95% of the way to grey
and only recovers its category colour as it is focused. That is what gives the
legacy a field of neutral hairlines with the selected orbit picked out in
colour. Without it every path in the scene is tinted at once and the selected
one has nothing to set it apart but width.

It is inlined into the fade patch rather than taken from the shared
`desaturate` chunk: LineMaterial is patched through `onBeforeCompile`, not
through three's chunk registry, so a second definition of `generic_desaturate`
would collide wherever both were included.

## Patching LineMaterial: pick the splice points carefully

`fade.ts` injects into LineMaterial's shaders by string replacement, so the
anchors matter.

- `#include <common>` carries the declarations, because LineMaterial's own
  globals sit inside feature guards.
- **`worldPos` is the obvious candidate for a view-space position and cannot be
  used** — it only exists under `WORLD_UNITS`, which is off unless the line is
  measured in world units. The patch therefore carries its own varying.
- A patch that fails to compile renders _nothing_, which looks identical to the
  fade working perfectly. The first attempt at this spliced against `worldPos`,
  the shader failed, the path vanished, and only the console said so. **After
  editing these shaders, check the console before trusting your eyes.**

## Why the near-camera fade exists at all

In object view the camera sits on the orbit — it is following a body that is
itself on the line — so the path passes within a couple of body radii of the
eye. That is genuine perspective, but it does not read as one: the two halves
sweep off at wildly different screen angles and the orbit looks like it turns a
corner at the planet.

Fading the nearest stretch removes exactly the part whose projection is
pathological. The legacy started this and never finished it: `PathMaterial`
still carries `planetPosition` and `fadeDistance` uniforms and the smoothstep
is commented out in `path/frag.glsl`. This keys on distance from the camera
rather than from the planet, since it is the camera that makes the projection
degenerate — which also means the fade costs nothing in orbit view, where the
whole path is far away.

The band is proportional to the body's radius because object view frames every
body at the same few multiples of its own radius; a fixed distance would be far
too aggressive for a planet and do nothing for an asteroid.

## Elliptical orbits are sampled by angle, not walked through time

The legacy stepped through dates, advancing until the position had moved far
enough from the last point, until it came back round to the start. That walk
is unbounded for a long, thin orbit: the body crawls near aphelion, so a
day-sized step barely moves it and the trace runs to tens of thousands of
Kepler solves (the legacy fixed this in v2.0.9, after the port began).

An earlier version of this file bounded the walk instead, with a point cap and
a probe floor relative to the period. **That bound hid a worse fault: for
eccentricity of roughly 0.95 and up it stopped at the cap before the orbit
closed.** A closed spline was then fitted through a partial arc. An orbit with
a = 300 AU, e = 0.99 reached 349 AU instead of 597 and never came inside 146 AU
instead of 3, and any such object you selected drew the wrong shape. Cost was
fine; the answer was not.

`buildOrbitPath` now samples evenly in eccentric anomaly, 250 points for a
circle up to 1,500 for the thinnest ellipse, which is the legacy's own fix and
costs a fixed number of solves whatever the orbit. The spline is still
resampled to about a thousand points afterwards, so the count only needs to be
enough to define the shape.

**Each point is still evaluated at a date**, not placed from the elements
alone. The date is the one at which the body reaches that anomaly within the
revolution starting today, which is what the old walk covered. That matters for
Jupiter, Saturn and Uranus, whose perturbation terms depend on the date; the
legacy's version of the fix drops them from the path, which would leave those
three planets off their own lines by up to a degree.

## Unbound orbits

The legacy drew nothing for these — `EllipticalPath` logged "Object does not
have an elliptical orbit" and returned — so every comet on an escape trajectory
and both interstellar objects had a body and no path. `buildOpenArc` samples in
true anomaly instead of stepping through time, because an unbound orbit has no
period to walk around and time-stepping is badly conditioned: the body crawls
for centuries at 400 AU and crosses perihelion in days.

## Framing is derived from the elements, not the polyline

`orbitFraming` works out where to put the camera to see the whole orbit rather
than the body, and it does so from the elements directly. Two reasons: the
camera need not wait for the trace to finish, and the two cannot disagree.

`ORBIT_FRAMING` is a fraction of the orbit's own size. `OPEN_FRAMING_Q` frames
an unbound orbit in perihelion distances instead — its arc runs out to 500 AU,
but the part worth looking at is the turn around the Sun.

## Geometry is memoised on the elements

Tracing is expensive and the result does not change as the clock runs: the
body moves along a fixed ellipse. Nothing here needs recomputing per frame.
