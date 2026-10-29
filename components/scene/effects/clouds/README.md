# Clouds

Earth's cloud layer, ported from the legacy Eleventy app.

## It is generated, not loaded

This is not a texture lookup. The fragment shader evaluates 4D fbm noise in
polar coordinates and renders it into an offscreen target, which is then
sampled as Earth's cloud map.

**The fourth noise dimension is time**, so the cloud field evolves as the
simulation clock runs rather than merely rotating with the planet.

## Regeneration is throttled

The noise is expensive — six fbm octaves over a megapixel target — and clouds
only need to change on a scale of simulated hours, so re-rendering every frame
would be waste. `TIME_THRESHOLD` is a minimum delta in the clock's own units,
matching the legacy's.

## One field for the whole scene

Generated once and passed down, rather than created per body. Only Earth
samples it, and the noise is far too expensive to evaluate thirteen times —
see `components/scene/celestial-bodies/README.md`.

It runs at priority -1, so the texture is regenerated before the compositor
draws the frame that samples it, and it is created inside the effect that
disposes it for the reason documented in
`components/scene/effects/solar-particles/README.md`.
