# Solar particles

The field of minor bodies, ported from `gfx/solar/SolarParticles.ts`. One
instanced low-poly sphere per object, with the vertex shader reading each
instance's position out of the GPU simulation texture rather than from an
instance matrix — so moving hundreds of thousands of objects costs one
render-target pass instead of hundreds of thousands of matrix writes.

Instances are laid out in the same row-major order as the simulation texels,
and `simUV` carries the lookup coordinate. `particles_instanced.vert` and
`.frag` are byte-identical to the legacy's, confirmed against production's
deployed bundle — not just against the legacy source tree, which has drifted
from what is deployed.

## Category colours are colour-managed, like everything else

`setStyle(hex)` with no colour space, so Craft's sRGB hex is converted to
linear before the shader sees it. There is nothing special about the particles
here; this note exists because the port did the opposite for several sessions
and the reasoning is worth keeping.

An earlier pass measured production's particles as *un-managed* — the sRGB
numbers handed to the shader as if they were already linear — and matched that
deliberately, with `setStyle(hex, LinearSRGBColorSpace)`. Re-measured on
2026-10-09 against the same tier (`high`, both clients confirmed on
`mpc_orbits-high-v14.json`), the same 1440x900 viewport and the same framing
(both recentred; labels agree to 23px horizontally, 1px vertically), the
measurement comes out the other way.

Working Craft's asteroid pink `#ff6eb4` through the shader predicts the two
candidates, and the belt's brightest 0.5% of pixels — where coverage is
effectively 1, so the pixel *is* the particle colour — picks between them:

```
                              R     G     B
predicted, managed           146    97   118
predicted, un-managed        155   127   141
measured, production         144   105   119
```

Blue decides it, as it did before, and it now reads 119 against 118 managed
and 141 un-managed. Over the whole belt the un-managed port was 26% brighter
than production and carried 57% of its chroma; managed, the two agree to 1.7%
on luminance and 1.6% on chroma.

The likely explanation is that production has been rebuilt since. The legacy
source pins three `^0.174.0`, where `ColorManagement.enabled` defaults to
`true`; the un-managed look belonged to a build older than r152. Whatever the
cause, **measure production rather than trusting this note** — it has flipped
once.

Take the measurement off the framebuffer, not off a screenshot. `toDataURL()`
called inside a `requestAnimationFrame` callback returns the real pixels even
without `preserveDrawingBuffer`, because the drawing buffer survives until the
frame composites. JPEG chroma subsampling is exactly the wrong thing to apply
to a question about chroma.

The uncategorised grey is managed too, and always was. The orbit paths are
managed; at 95% desaturation the hue barely shows either way.

## Do not compensate for apparent dimness here

`PARTICLE_PIXEL_SIZE` is `1`, the legacy's value, confirmed against the
deployed bundle's `fixedSize: { value: 1 }`.

It was briefly raised to 1.4, on the measurement that production's particles
covered 1.9x the pixel area for the same peak brightness. The arithmetic was
right and the conclusion was wrong: the area gap was a *threshold artefact* of
the scene reaching the canvas at half brightness (see
`components/effects/composite/README.md`). Brighter particles put more of each
dot above whatever cutoff you measure against, which reads as a bigger dot.

Verified both ways once the real bug was fixed: 1.4 → 1 moves coverage from
19.3% to 11.7% and leaves core luminance at 66 either way. **Size was never the
brightness lever.** The renderer's pixel ratio was raised for the same mistaken
reason and reverted for the same one.

## near/far are the scene's fog, not the camera's clip planes

`FADE_DISTANCE` is 5,000 and 100,000 — `NEAR` and `FAR` from
`gfx/OrbitViewer.ts`, which despite the names have nothing to do with the
camera's clip planes (those are 0.01 and ~8,000,000). They are the fog, and the
particle shader reads them through `GLOBALS.fog`:

```glsl
depth = smoothstep(near, far, distanceToCamera);
alpha = 1 - depth;
```

Passing the clip planes instead makes the smoothstep a no-op — every particle
returns at full alpha however far away it is. The result is not a brighter
field but a *flatter* one: objects at 50, 200, 500 AU, which the legacy fades
to nothing, get painted as strongly as the main belt and spread a uniform haze
across the frame. Against that, the belt stops reading as a belt.

`FADE_IN_SECONDS` reproduces `OrbitViewer.fadeIn()`, which eased `fog.far` from
`NEAR` up to `FAR` on arrival, so the system fills in from the camera outwards.

## The simulation must be created inside the effect that disposes it

`useMemo` plus dispose-in-cleanup is a trap here. StrictMode mounts, unmounts
and remounts in development, which runs the cleanup — disposing the render
target and clearing the sim scene — while `useMemo` keeps handing back the
same, now-dead instance. The result is a sim that ticks every frame against an
empty scene and writes nothing, so every particle reads position (0,0,0) and
the entire field collapses onto the sun.

Instance colours have the same shape of problem: the buffer must exist before
the material first compiles, because three only declares
`attribute vec3 instanceColor` when `USE_INSTANCING_COLOR` is set, and it
derives that from `mesh.instanceColor !== null` at compile time. Allocating it
later via `setColorAt()` is too late — the program fails with
"'instanceColor' : undeclared identifier" and nothing in the field draws.
