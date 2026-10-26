# Scene

Everything that mounts inside the R3F `<Canvas>`. This folder is the boundary
between the DOM interface and the WebGL one: `SceneCanvas` owns the context,
`Scene` is the graph, and `celestial-bodies/` and `effects/` hold what goes
in it.

**Nothing here renders to the DOM** — with one deliberate exception,
`celestial-bodies/label`, which uses drei's `<Html>` to project a real DOM
label over the canvas. Nothing outside this folder may mount these
components, and nothing in it belongs to the atomic hierarchy: a `.frag` file
has no place on that ladder, and `effects/benchmark`, `effects/capture` and
`effects/composite` render nothing at all. The one eslint override for
`react/no-unknown-property` is scoped to exactly this folder.

`Scene` replaces the legacy's single 620-line viewer class, which owned the
renderer, scene, camera, lights and every body; under R3F the Canvas owns the
renderer and each concern is a component.

## Do not set `dpr` on the Canvas

The tier's `maxPixelRatio` is **deliberately not applied**. Measured with both
apps in the same pane, same CSS size, same display:

```
legacy site  1024x768 css  ->  2048x1536 buffer   ratio 2.0
this port    1024x768 css  ->  1536x1152 buffer   ratio 1.5
```

The legacy's source does call `setPixelRatio(Math.min(devicePixelRatio,
maxPixelRatio))` and even forces the medium tier's 1.5 on desktop — yet the
legacy site, the Eleventy app as deployed in October 2026, renders at the full
device ratio regardless. Same shape as the tier's sample count; see
`components/scene/effects/composite/README.md`.

Applying it cost a quarter of the port's linear resolution, which showed up as
a dimmer particle field: a particle is a sphere one CSS pixel in radius, so at
1.5 each lands on 1.5 device pixels against the legacy site's 2 and is then
resampled up to the display.

R3F's default clamp of `[1, 2]` is what the legacy site does on any ordinary
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
See `components/scene/celestial-bodies/camera/README.md` for what went wrong when the
camera ran first.

## Orbit view

A selected path is drawn at full opacity and then left off screen if the camera
is parked a few body-radii away — so before this existed, no orbit was ever
actually visible while selected. The legacy solved it with an ORBIT/OBJECT
toggle; this is the same idea with the choice in the URL, so the framing is
shareable. The pivot is fixed rather than written per frame: an orbit does not
move.

Which framing a selection _defaults_ to is decided by the body — see
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
the particles, matching the legacy, where the category filter gated the named
bodies too. A focused body stays regardless, so a share link to one still
shows it.

## The canvas is mounted once

`SceneCanvas` is the WebGL context itself, split out so the viewer shell can
own it. It is mounted once per visit, above the routes that show the scene,
and **must not be rendered anywhere else** — see `components/templates/Viewer`.

Two settings on it are deliberate:

- **A logarithmic depth buffer.** The scene spans six orders of magnitude,
  from a 24-unit near limit to 3,000,000 units; a linear buffer z-fights
  badly across that range.
- **The render loop always runs.** Rendering is on-demand elsewhere, but the
  clock advances every frame, so `frameloop` cannot be `"demand"` here.

`ClockDriver` drives that clock and **exactly one may exist**.

## Shader chunks are registered at module scope

Chunks must be on three's `ShaderChunk` before any material that `#include`s
them compiles. Module scope runs once, ahead of first render, which is why the
registration is not in an effect.

## What the scene holds

- The **sun** is the only light source; everything else is lit by it. A trace
  of ambient keeps night sides from going fully black, which reads as a hole
  rather than a shadowed limb.
- The **minor-body field**: hundreds of thousands of objects propagated on the
  GPU. This is what fills the default system-wide view.
- **Craft's named minor bodies**, an orbit path and a labelled marker each.
  These carry the categories — Trojan, centaur, TNO, NEO, comet, interstellar
  — that the planets, all `planets-moons`, never show. The legacy gave each
  one a scene element with its mesh commented out, so a body here is a point
  the label and camera hang off rather than something meant to be seen at this
  distance.
- One **cloud field** for the whole scene; only Earth samples it.

Schlyter's perturbation terms for the giants need the mean anomalies of
Jupiter, Saturn and Uranus, so those three elements are passed down — see
`lib/solar/README.md`.

Clicks are resolved by **raycasting the mesh**, which is pixel-accurate and
needs no per-frame screen-space projection. The legacy put a projected DOM
anchor over each body to catch them.

## Following a selection

The live position of the followed body is written by whichever body is focused
and read by the camera each frame, so **following costs no React renders**.

Two bodies are special cases:

- **The Sun** has a Craft entry but no orbital elements, so `resolveObject`
  never finds it. It sits at the origin and never moves. The legacy had a
  separate `followSun()` for the same reason.
- **A focused MPC object** is not one of the thirteen bodies in the scene — it
  exists only as a texel in the GPU simulation, which the CPU cannot read back
  cheaply. Propagating a single orbit per frame is negligible, so it gets its
  own body, exactly as the legacy created a scene element for it.

The URL's object param is compared against the _resolved_ object rather than
the raw string, which may differ in case from the element's id. For a named
object it is **Craft's id, not the element's**, since that is what reaches the
URL and what the server can resolve (`NamedObject.shareId`).

## The discovery filter is tri-state

Boolean in the scene, but three-valued in the URL: `undefined` means no
filtering at all, which is not the same as `false`. The category set is only
worth passing once something is actually switched off — leaving it undefined
skips the test entirely.

## Bodies are rendered larger than life

`BODY_RADIUS_SCALE` is 100, matching the legacy. At true scale Earth
is 4.2e-5 AU across in a scene spanning tens of AU. The planets being sub-pixel
at system-wide framing is by design — that view is carried by the particle
field, not by the planets.

Catalogue objects get a nominal radius purely so the camera has something to
frame and the label something to clear; the MPC dataset carries no size. At
that radius the body is far below a pixel at system framing, which is the
legacy's behaviour rather than a shortcoming of it — its scene element had
its mesh commented out entirely, so a named minor body was an orbit path and a
label and nothing else.
