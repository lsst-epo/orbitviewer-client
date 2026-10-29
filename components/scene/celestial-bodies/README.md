# Celestial bodies

Solid bodies and the things attached to them: `body`, `label`, `ring`, `sun`.
The camera has its own README in `camera/`.

`Body` is ported from the legacy Eleventy app, where it was a class bound to
the eight planets; this takes orbital elements plus a radius and renders any solid
body, so one component covers planets, dwarf planets and anything Craft
describes. Position is recomputed every frame from the simulation clock and
written straight to the object, never through React state — re-rendering per
frame would be far too expensive.

## The scene graph has three levels, and each one earns its place

```
<group>                     position     — the label hangs off this
  <group rotation-z={tilt}> axial tilt
    <mesh rotation.y={spin}> spin        — atmosphere and ring nest inside
```

**Tilt and spin cannot live on the same object.** three composes them in Euler
order, and the default `XYZ` gives `RY(spin) · RZ(tilt)` — the body is tilted
and then turned about the _world_ vertical, so its own axis traces a cone and
it wobbles like a spinning top instead of rotating. Jupiter showed it worst,
having visible banding and a three-degree tilt to swing through.

Nesting puts the spin inside the tilted frame, which is what `Planet.ts` does
(`container.rotation.z` carries the tilt, `mesh.rotation.y` the spin). The
world matrix is then `T · RZ(tilt) · RY(spin)`, and because `RY` leaves the Y
axis invariant the spin axis is `RZ(tilt) · (0,1,0)`: constant, and tilted.

**The label must hang off the position group, not the mesh**, or the planet's
spin swings it around.

The tilt is negated and summed with the orbital inclination, as the legacy has
it: axial tilt is quoted against the body's own orbital plane, so adding the
inclination expresses it against the ecliptic the scene is built in.

## The material patches a built-in, it does not replace one

`BodyMaterial` extends `MeshStandardMaterial` **so the body still receives the
sun's `PointLight` through three's standard lighting chunks**, then patches the
compiled program:

- the vertex shader gains world-space position and normal varyings, which the
  Earth night-side and cloud layers need;
- the fragment shader is replaced wholesale with `body.frag`, a copy of three's
  standard fragment shader with the glow and Earth passes spliced in.

`isGlow` / `hasGlow` feed the bloom pass: with `isGlow` set, the body renders
only the portion of its colour bright enough to bleed. The compositor finds
that uniform on the cached `shaderRef` rather than on the material, for the
reason set out in `components/scene/effects/composite/README.md`.

**`declare defines` is not decoration.** `MeshStandardMaterial` sets
`defines = { STANDARD: "" }` in its constructor and three does not declare the
field in its types. `declare` re-types the inherited property without emitting
an initializer — a real field here would run after `super()` and wipe the
`STANDARD` define, breaking the standard shader outright.

## Per-frame discipline

- Vectors are allocated once and reused. Allocating a `Vector3` per body per
  frame is the single easiest way to make this scene stutter.
- React does not dispose materials it did not create, so this does.

## `raycast={undefined}` is a no-op, and is marked TODO

The mesh carries `raycast={undefined}`, which a comment described as "a
slightly generous raycast threshold" making small bodies easier to click.
**Neither half of that is true:**

- A mesh raycast has no threshold. `Raycaster.params` is
  `{ Mesh: {}, Line: { threshold: 1 }, Points: { threshold: 1 }, … }` —
  thresholds are a line and point feature, and `Mesh.raycast` never reads one.
- `undefined` leaves three's own `Mesh.raycast` in place, so the prop changes
  nothing.

It is still here rather than quietly removed because the **intent** behind it
is sound: bodies are exaggerated but still small on screen, and pixel-hunting
for one at system framing is a real complaint. Two ways to settle it:

- **Drop the prop.** Selection already works through the default mesh
  raycast, which is pixel-accurate against the sphere.
- **Give bodies a real hit target** — a custom `raycast` with a tolerance, or
  an invisible, slightly larger sphere that takes the click.

Until that is decided it is a no-op that reads as deliberate, which is the
worst of the three options.

## Textures are a stub

`textures.ts` holds bundled maps for the eight planets only, and that is
deliberately a seam: per the port plan these move to a Craft `texture` field
so the generalised `<Body>` can render anything the CMS describes.
`textureSetFor` is where the Craft-provided URLs will arrive, falling back to
the bundled assets — **no call site changes when that lands.**

They are imported rather than referenced as public paths so Turbopack
fingerprints them and they get long-lived cache headers.

## Labels

Ported from the legacy Eleventy app, which projected an absolutely positioned
anchor over the canvas and moved it every
frame by writing `transform: translate(...)` from screen coordinates it
computed itself. drei's `<Html>` does the projection, so what is left is what
was genuinely bespoke: hiding the label when the body is behind the camera, and
standing down for a body that is already selected.

**The disc is what carries the category, not the glyph.** The category colour
fills a 20px disc with the glyph reversed out of it, as the legacy's did. Drawn as a bare 14px tinted outline — as this first was — every glyph in
the set collapses into the same grey smudge and the categories become
indistinguishable, however correct the colour is.

The legacy's label was an `<a href>` into a per-object route. Selection is a
search param now, so this is a `<button>`: it changes the view rather than
navigating, and a link that does not navigate is a lie to anyone using a
keyboard or a screen reader.

**The label is hidden when the body is behind the camera.** drei's `<Html>`
projects with the same matrix whether a point is in front of the camera or
behind it, so without the check the label reappears mirrored on the far side
of the screen — the bug the legacy guarded against with its own
`isBehindCamera()`.

Three placement details:

- The label is **not** centred on the body. The disc is what sits on the
  object and the name runs off to its right, which is the legacy's own offset.
  drei's `center` would instead centre disc and name together, walking the
  disc half a name-width left of the thing it points at — which is exactly
  where the port's labels were.
- They sit over the scene but **under the interface panels**, matching the
  band the legacy gives them. drei's default of 16 put them over the splash
  scrim and the panels.
- The wrapper takes no pointer events so drags pass through to the canvas; the
  button takes them back for itself. Without that the label swallows orbit
  drags crossing it.

Dimensions are in rem for the same reason the rest of the port's are: the
legacy authors them in px and converts on the way out, so the legacy site
scales them with the root font. Its own caption style is commented out there,
so the label inherits the body text.

## Rings

The ring is a `.glb`, not three's `ringGeometry`, **because of the UVs**. The
ring texture is a radial strip; `ringGeometry` maps UVs across the bounding
box, so the bands would smear across the annulus instead of forming circles.

It is a child of the body's mesh so it inherits the axial tilt — which is the
whole reason Saturn's rings sit where they do — and the radius, so its own
scale is a plain multiple of the surface.

**The geometry is lifted out of the loaded scene rather than the scene being
reused.** `useGLTF` caches by URL, so mutating what it returns — which is what
the legacy did — would reach every other consumer of the same model.

Two things the bare geometry does not bring with it:

- **The glb authors the annulus in XY.** The node transform that lays it flat
  is not carried over, so the rotation is applied here.
- The ring is lit from one side by the sun but seen from both, and its own
  transparent fragments would otherwise occlude the far half of the annulus
  behind it.

Rings are not a selectable body — clicks belong to the planet.

## Sun

Three pieces share one shader: the body, a halo (the same shader with `HALO`
defined, displacing vertices through curl noise and rendering only the fresnel
rim), and the magnetic field lines.

The halo and field lines belong to the compositor's fire pass and sit on
`FIRE_LAYER`, so the main camera never draws them un-blurred. The body itself
is present in **both** passes — lit normally in one, black in the other — so
its disc occludes the halo rather than letting it bleed through. The
compositor discovers all of this through `userData` rather than by reference,
which keeps it independent of how the sun is assembled.

The halo's rim is twice as wide as the body's.

Surface detail animates against **simulation** time, so scrubbing the clock
scrubs the granulation with it. It is relative to the clock's origin rather
than the epoch — see `getSimulationTime` for why that distinction matters to
the noise functions.

## Textures

Only the eight planets have them. Dwarf planets and catalogue objects render as
untextured spheres, which is why the camera frames those on their orbit instead
of flying up to them — see `lib/explorer/README.md`.
