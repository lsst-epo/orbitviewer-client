# Celestial bodies

Solid bodies and the things attached to them: `body`, `label`, `ring`, `sun`.
The camera has its own README in `camera/`.

`Body` is ported from `gfx/solar/Planet.ts`, which was a class bound to the
eight planets; this takes orbital elements plus a radius and renders any solid
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
and then turned about the *world* vertical, so its own axis traces a cone and
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

## Labels

Ported from `gfx/solar/SolarDomElement.ts` and `components/pointer.njk`, which
projected an absolutely positioned anchor over the canvas and moved it every
frame by writing `transform: translate(...)` from screen coordinates it
computed itself. drei's `<Html>` does the projection, so what is left is what
was genuinely bespoke: hiding the label when the body is behind the camera, and
standing down for a body that is already selected.

**The disc is what carries the category, not the glyph.** The category colour
fills a 20px disc with the glyph reversed out of it, as `.canvas_pointer-icon`
did. Drawn as a bare 14px tinted outline — as this first was — every glyph in
the set collapses into the same grey smudge and the categories become
indistinguishable, however correct the colour is.

The legacy's label was an `<a href>` into a per-object route. Selection is a
search param now, so this is a `<button>`: it changes the view rather than
navigating, and a link that does not navigate is a lie to anyone using a
keyboard or a screen reader.

## Rings

The ring is a `.glb`, not three's `ringGeometry`, **because of the UVs**. The
ring texture is a radial strip; `ringGeometry` maps UVs across the bounding
box, so the bands would smear across the annulus instead of forming circles.

It is a child of the body's mesh so it inherits the axial tilt — which is the
whole reason Saturn's rings sit where they do — and the radius, so its own
scale is a plain multiple of the surface. The geometry is lifted out of the
loaded scene rather than mutating it, since `useGLTF` caches.

## Sun

Three pieces share one shader: the body, a halo (the same shader with `HALO`
defined, displacing vertices through curl noise and rendering only the fresnel
rim), and the magnetic field lines.

The halo and field lines belong to the compositor's fire pass and sit on
`FIRE_LAYER`, so the main camera never draws them un-blurred.

## Textures

Only the eight planets have them. Dwarf planets and catalogue objects render as
untextured spheres, which is why the camera frames those on their orbit instead
of flying up to them — see `lib/explorer/README.md`.
