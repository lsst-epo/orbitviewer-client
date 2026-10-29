# Blur pass

`blur.frag` and `fbo.vert` are lifted verbatim from `@fils/vfx`, which the port
plan removes as a dependency. They are unmodified: the separable Gaussian
kernels are Matt DesLauriers'
(https://github.com/Jam3/glsl-fast-gaussian-blur), and the three `mode` values
select 5-, 9- and 13-tap variants.

They are ESSL 1.00 (`attribute` / `varying` / `texture2D`, with their own
precision and matrix uniform declarations), so they must be used with a
`RawShaderMaterial` — three adds no prefix and no `#version 300 es` to those,
which is what keeps this source valid. Using a plain `ShaderMaterial` would
force them to ES 3.00 and they would fail to compile.

## The blur is separable

`BlurPass` reimplements the one from `@fils/vfx`. Each iteration blurs along a
single axis, alternating horizontal and vertical and ping-ponging between two
render targets — N iterations of a K-tap 1D kernel approximate a much wider 2D
kernel at a fraction of the cost. The first pass is horizontal.

It is drawn on a unit plane scaled to the target and framed by an orthographic
camera: the usual fullscreen quad.

## Scaled targets must be whole pixels

`scale` trades quality for cost by blurring at a fraction of the source size,
but a render target cannot have a fractional dimension — a scale of 0.25
against an 833px viewport yields 208.25. Every scaled dimension is rounded and
floored at 1.

## Settings that change dimensions need a reallocation

`applySettings` exists because `scale` and the target size are bound together:
changing one without rebuilding the targets leaves the pass sampling at the
wrong resolution. This is the same shape as the tier-sample trap described in
`components/scene/effects/composite/README.md` — a setting that looks applied and
is not.
