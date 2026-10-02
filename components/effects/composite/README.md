# Glow / bloom compositor

Ported from `gfx/core/RubinRenderer.ts`, which replaced the renderer's render
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
measurements land on the prediction:

```
linear out of the particle shader   (0.326, 0.213, 0.268)
written with the encode             (155, 127, 141)   luminance 134
written without it                  ( 83,  54,  68)   luminance  61

measured, port before                                 luminance  66
measured, port after                                  luminance 137
measured, production                                  luminance 129
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

## GFXTier states an intent the legacy does not carry out

Two settings, same shape, and both cost this port fidelity when read honestly.
**Do not treat `GFXTier` as a specification — check what production actually
does before porting a tier value.**

- **`maxSamples`** — `setTier` appears to apply it, but lowering it only takes
  effect when the target reallocates, and reallocation happens in `setSize`,
  which returns early unless a dimension actually changed. The legacy's
  `sceneRT` is built with `samples: 4` and keeps it, so production runs 4x MSAA
  at every tier while this port's low tier runs with none
  (`msaaSamples` maps a tier value of 1 to 0).

  **This divergence is knowingly left in place.** It was tested as a candidate
  for the brightness gap and moved nothing measurable — mean luminance 33.7
  with MSAA off against 31.1 with 4x — because the particles are about 2.8px
  across and only their rim is at stake. Matching production here would cost
  memory and bandwidth at the low tier for no visible gain.
- **`maxPixelRatio`** — the legacy calls
  `setPixelRatio(Math.min(devicePixelRatio, tier.maxPixelRatio))`, and
  `OrbitViewerPage` even forces the medium tier's 1.5 on desktop. Production
  renders at the full device ratio regardless. Applying the cap cost this port
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
