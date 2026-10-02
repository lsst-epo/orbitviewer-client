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

## Category colours are deliberately NOT colour-managed

`setStyle(hex, LinearSRGBColorSpace)` feeds Craft's sRGB hex to the shader as
if it were linear. That is intentional, and it is the one place in the scene
where it is done.

Production's particles are lighter and pinker than a colour-managed port's,
which come out darker and redder. Measured off screenshots of both over a
matched window, particle density is near identical — 11.8% of pixels against
10.6%, so it is not size or count — but production carries 1.7x the mean
luminance, and the core colours part company on blue. Working Craft's asteroid
pink `#ff6eb4` through the shader both ways settles which is which:

```
converted to linear first   vColor (1.0, 0.156, 0.456)  ->  (146,  97, 118)
used as-is                  vColor (1.0, 0.431, 0.706)  ->  (155, 127, 141)
measured, production                                        (148, 121, 141)
```

Blue decides it: 141 measured against 141 predicted un-managed and 118
predicted managed.

Production is almost certainly built against a three older than r152, where
`ColorManagement.enabled` defaulted to `false` and `new Color('#ff6eb4')` kept
the sRGB numbers for the shader to consume as linear. **The legacy source now
pins `^0.174.0`, where the default is `true` — so a rebuild of the legacy today
would not look like the site it deploys.**

So the colour-managed version was the *correct* one and production is the
accident. Production is what people know, so it is what gets matched. The
uncategorised grey stays managed, because the legacy converts that one
explicitly (`new Color(0x999999).convertSRGBToLinear()`) and lands in the same
place either way. The orbit paths are still managed; at 95% desaturation the
hue barely shows, but they are the next candidate if this is ever wanted
scene-wide.

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
