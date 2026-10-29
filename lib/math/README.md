# Math helpers

Replaces `@fils/math`, which the port plan removes as a dependency. three's own
`MathUtils` covers most of this; what is here is what it does not export with
the same semantics.

`expoInOut` is gsap's `expo.inOut`, which the legacy uses for both the
discovery count-up and the splash's clock ramp. It is inlined because gsap is
not a dependency here either.

## The generator is seeded on purpose

`random.ts` replaces `@fils/math`'s Mersenne Twister wrapper with mulberry32 —
a few lines, no dependency, and more than good enough for scattering geometry.

**It is seeded by default, and that is a deliberate change.** The legacy left
the generator on its implicit seed, so the sun's magnetic field was laid out
differently on every load. A fixed seed makes the scene reproducible, which
matters when comparing screenshots between this app and the legacy site.
