# Glow / bloom compositor

Ported from the legacy Eleventy app, where it replaced the renderer's render
call outright. Taking a `useFrame` priority above zero switches R3F's automatic
rendering off for the whole canvas, so from that point drawing the scene is
this component's job — including when it has no compositor to draw with, which
is why the fallback in the frame callback is not optional.

Per frame:

1. render the scene normally → `sceneRT`
2. render it again in "glow" mode → `glowRT`
3. blur the glow → `glowBlur.texture`
4. the sun's fire pass → `fire`
5. composite all of the above → `compRT`
6. blit to the screen or a target

## The fallback is not optional

Taking a `useFrame` priority above zero switches R3F's automatic rendering off
for the whole canvas — **including when this component has no compositor to
render with.** Without the fallback in the frame callback, a compositor that
fails to build leaves a blank canvas rather than an un-bloomed scene.

For the same reason the compositor is created inside the effect that disposes
it, never in a `useMemo`: in StrictMode the cleanup would free the GPU
resources while the memo kept handing back the dead instance. See
`components/scene/effects/solar-particles/README.md`, where the same trap is
documented in full.

Resizing has to run on a **pixel-ratio change as well as a resize**. Render
targets are sized in device pixels; R3F's `size` is in CSS pixels and does not
move when the ratio does.

## Layers, not a second scene

The legacy moved objects into a separate scene for the fire pass and put them
back afterwards. Reparenting objects React owns would fight the reconciler, so
this switches the **camera's layer mask** instead:

- `DEFAULT_LAYER` (0) is everything the main pass draws, three's default.
- `FIRE_LAYER` (1) holds the sun's halo and magnetic field. They are invisible
  to the main camera and drawn only when the compositor switches over, so they
  never appear un-blurred.

The sun's own body is on **both** layers, and swaps to an opaque black
material during the fire pass so its disc occludes the halo behind it rather
than letting it bleed through. That contract is carried in `userData` rather
than by reference, which keeps the compositor independent of how the sun is
assembled.

The fire pass keeps its own fixed blur settings rather than the tier's, as the
legacy does, so the plasma looks the same on every machine.

## The glow pass hides what cannot contribute

`prepareForGlowRender` switches every glow-capable mesh into glow mode and
hides the rest; `prepareForSceneRender` puts it all back. Previous visibility
has to be stashed, since the pass is destructive to it.

Two details that look like bugs and are not:

- **The glow pass is never anti-aliased.** It is about to be blurred.
- **`Line2` reports `isMesh`**, and its `LineMaterial` has no `isGlow`
  uniform — so the orbital paths are hidden during the glow pass. That matches
  the legacy's behaviour.

## The screen blit must be a built-in material

**This is the most expensive bug the port has had.** The whole 3D scene reached
the canvas in linear colour, at roughly half brightness, for several sessions.

The blit was a raw `ShaderMaterial` doing `texture2D(scene, vUv)`, on the
reasoning that a pass-through shader leaves colour alone. It does not. Every
target here is declared `SRGBColorSpace`, which three backs with an
`sRGB8_ALPHA8` internal format — so the GPU encodes linear→sRGB on write and
decodes sRGB→linear on sample, **in hardware, whatever the shader says**. A raw
shader therefore samples decoded linear values and writes them to the default
framebuffer, which is not an sRGB target and so never encodes.

The legacy never had the problem: `SCREEN_MAT = new MeshBasicMaterial()`, and
three appends `<colorspace_fragment>` to built-in materials.

Working Craft's asteroid pink through the particle shader predicts it, and the
measurements land on the prediction. (The figures below are the un-managed
colour the particles carried at the time; see
`components/scene/effects/solar-particles/README.md`, which has since reversed that.
The ratio is what the argument rests on, and it is unaffected.)

```
linear out of the particle shader   (0.326, 0.213, 0.268)
written with the encode             (155, 127, 141)   luminance 134
written without it                  ( 83,  54,  68)   luminance  61

measured, port before                                 luminance  66
measured, port after                                  luminance 137
measured, legacy site                                 luminance 129
```

`toneMapped: false` because R3F defaults the renderer to ACES filmic where the
legacy leaves three's `NoToneMapping`, and tone mapping here would regrade the
composited image. The colour-space encode is a separate include and applies
either way.

The lesson worth keeping: it presented as "the particles look faint" and "the
orbit lines are invisible", and produced three plausible, individually-wrong
per-feature fixes (particle size, renderer pixel ratio, line width) before the
common cause surfaced. **When several features look wrong in the same
direction, suspect something they share.**

## `GFXTier` states an intent the legacy does not carry out

`GFXTier` mirrors the legacy's own tier settings. Two of them have the same
shape, and both cost this port fidelity when read honestly. **Do not treat a
tier value as a specification — check what the legacy site, the Eleventy app
as deployed in October 2026, actually does before porting it.**

- **`maxSamples`** — the legacy appears to apply it on a tier change, but
  lowering it only takes effect when the render target reallocates, and that
  happens on resize, which returns early unless a dimension actually changed.
  The legacy's scene target is built with `samples: 4` and keeps it, so the
  legacy site runs 4x MSAA at every tier while this port's low tier runs with
  none (`msaaSamples` maps a tier value of 1 to 0).

  **This divergence is knowingly left in place.** It was tested as a candidate
  for the brightness gap and moved nothing measurable — mean luminance 33.7
  with MSAA off against 31.1 with 4x — because the particles are about 2.8px
  across and only their rim is at stake. Matching the legacy site here would
  cost memory and bandwidth at the low tier for no visible gain.

- **`maxPixelRatio`** — the legacy calls
  `setPixelRatio(Math.min(devicePixelRatio, tier.maxPixelRatio))`, and even
  forces the medium tier's 1.5 on desktop. The legacy site renders at the full
  device ratio regardless. Applying the cap cost this port
  a quarter of its linear resolution, so the `<Canvas>` sets no `dpr` and takes
  R3F's default clamp.

The tier still governs what it demonstrably governs: glow, blur scale, blur
quality, iterations, and the size of the dataset.

## Finding the glow uniform

`setGlowUniform` discriminates on `shaderRef` rather than on a marker property.
Materials come in two shapes: a plain `ShaderMaterial` owns its uniforms
directly, while a patched built-in (`BodyMaterial`, which extends
`MeshStandardMaterial` and rewrites the program in `onBeforeCompile`) only
gains them once compiled, on the cached `shaderRef`.

This originally tested an `isCustomMaterial` flag that **nothing ever sets** —
`BodyMaterial` declares `isBodyMaterial`. Every body fell to the
`material.uniforms` branch, which a `MeshStandardMaterial` subclass does not
have, so `setGlowUniform` reported failure for all of them and the glow pass
hid every planet. Earth's night-side city lights are drawn in that pass and had
never once appeared.

Glow is off entirely on the `low` tier, in this codebase and the legacy alike,
so check the tier before concluding a glow effect is broken.
