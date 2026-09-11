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
