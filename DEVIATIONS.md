# Deviations

Intentional, temporary departures from the legacy Orbitviewer behaviour, made
to keep development workable. **Every entry here must be resolved before
release.** Each one is also flagged at the code site; remove the comment and
the entry together.

This is not the place for permanent design decisions made during the port --
those belong in the context doc (`agentic-context-docs/orbitviewer/`).

---

## 1. Celestial body radius is exaggerated 12x beyond the legacy value

**Where:** `components/templates/Explorer/Scene.tsx` — `BODY_RADIUS_SCALE`

**Current:** `1200` &nbsp;·&nbsp; **Must become:** `100`

**Why it differs:** the legacy `gfx/solar/Planet.ts` sized bodies as
`PlanetRadiusMap[type] * KM2AU * PLANET_SCALE * 100`. At that faithful value
the planets are sub-pixel at the default system-wide framing — in the legacy
viewer that view was carried by the particle field of tens of thousands of
minor bodies (`SolarParticles` / `GPUSim`), which is not ported yet. With the
particles absent and only 13 bodies in the scene, 100x renders as an almost
empty screen.

**Resolve when:** the solar particle system is ported. Restore `100`, then
confirm the default framing reads correctly with the particle field present.

**Risk if missed:** every planet and dwarf planet renders twelve times too
large. Most visible where bodies are compared against orbital distances or
against each other, and in the object detail framing.
