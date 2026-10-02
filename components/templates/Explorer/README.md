# Explorer

The explorer shell and its scene graph. `Scene.tsx` replaces
`gfx/OrbitViewer.ts`, which owned the renderer, scene, camera, lights and every
body as one 620-line class; under R3F the Canvas owns the renderer and each
concern is a component.

Panels mount alongside the canvas rather than inside it, and a tour swaps the
whole set for its own overlay — see the `overlay` prop.

## Do not set `dpr` on the Canvas

The tier's `maxPixelRatio` is **deliberately not applied**. Measured with both
apps in the same pane, same CSS size, same display:

```
production  1024x768 css  ->  2048x1536 buffer   ratio 2.0
this port   1024x768 css  ->  1536x1152 buffer   ratio 1.5
```

The legacy does call `setPixelRatio(Math.min(devicePixelRatio, maxPixelRatio))`
and `OrbitViewerPage` even forces the medium tier's 1.5 on desktop — yet
production renders at the full device ratio regardless. Same shape as
`GFXTier.maxSamples`. See `components/effects/composite/README.md`.

Applying it cost a quarter of the port's linear resolution, which showed up as
a dimmer particle field: a particle is a sphere one CSS pixel in radius, so at
1.5 each lands on 1.5 device pixels against production's 2 and is then
resampled up to the display.

R3F's default clamp of `[1, 2]` is what production does on any ordinary
display, so the prop is simply absent.

## Frame order

Priorities matter and are spread across components:

```
-2  ClockDriver      advance the simulation clock
-1  GPU sim          propagate orbits into the simulation texture
 0  Body             write each body's position
0.5 Camera           follow, reading those positions
 1  CompositorEffect render + glow + blur + composite
```

Anything that reads a position a `Body` writes must run after priority 0.
See `components/celestial-bodies/camera/README.md` for what went wrong when the
camera ran first.

## Orbit view

A selected path is drawn at full opacity and then left off screen if the camera
is parked a few body-radii away — so before this existed, no orbit was ever
actually visible while selected. The legacy solved it with an ORBIT/OBJECT
toggle; this is the same idea with the choice in the URL, so the framing is
shareable. The pivot is fixed rather than written per frame: an orbit does not
move.

Which framing a selection *defaults* to is decided by the body — see
`lib/explorer/README.md`.

The selected body keeps its label in orbit view and loses it in object view.
The legacy draws the same distinction in one line:
`sel.domRef.dom.style.opacity = followOrbit ? 1 : 0`. In orbit view the camera
is far enough out to take in the whole path and the body is a dot somewhere on
it, so the label is the only thing marking where — and that matters most for
the named objects, which have no visible body at that distance at all.

## Filters are shared on purpose

The particle field applies them in a shader attribute and the named bodies
apply them in React. They are built once as a single `ObjectFilters` and passed
to both, because if they drifted a named object could stay visible after its
category was switched off — the only one of its kind still on screen.

Switching "planets-moons" off hides the named bodies and their orbits, not just
the particles, matching the legacy where `UserFilters.categories` also gated
`SolarElement`. A focused body stays regardless, so a share link to one still
shows it.

## Bodies are rendered larger than life

`BODY_RADIUS_SCALE` is 100, matching `gfx/solar/Planet.ts`. At true scale Earth
is 4.2e-5 AU across in a scene spanning tens of AU. The planets being sub-pixel
at system-wide framing is by design — that view is carried by the particle
field, not by the planets.

Catalogue objects get a nominal radius purely so the camera has something to
frame and the label something to clear; the MPC dataset carries no size. At
that radius the body is far below a pixel at system framing, which is the
legacy's behaviour rather than a shortcoming of it — `SolarElement` had its
mesh commented out entirely, so a named minor body was an orbit path and a
label and nothing else.
