# Atmosphere

A body's atmospheric shell, ported from the legacy Eleventy app's planet code.

A slightly larger sphere around the body, rendering only a fresnel rim: the
shader discards everything but the grazing-angle band, so the sphere reads as
a halo of air rather than a second surface.

## It must not write depth

The shell sits in front of the body it belongs to. Writing depth would make it
occlude the surface it is meant to sit on, which is the one thing it exists to
sit on.

## It contributes to the bloom pass

It declares `hasGlow`, so the compositor picks it up — see
`components/scene/effects/composite/README.md`. The rim is the part of a planet that
should bleed.
