# Contexts

Shared state for the explorer: URL params, the loaded dataset, the simulation
clock, search, and the ref bridges between the DOM and the render loop.

## The context bridge pattern

Four of these exist to cross the DOM/render-loop boundary: `SceneControls`,
`Capture`, `Benchmark`, and the camera target. The shape is always the same —
**a context holds the intent in a ref, and a component inside the `<Canvas>`
reads that ref in `useFrame`.**

A ref rather than state because the consumer runs every frame: routing a
button press through React state would re-render the tree to deliver a value
the frame callback could have read directly, and routing a body's live position
through state would re-render it sixty times a second.

If you need the DOM to ask the scene for something, follow this pattern rather
than inventing a fifth one.

## URL writes use the History API, in an effect

`history.replaceState`, not `router.replace()`. A router navigation re-renders
the server component tree, which tears down and remounts the WebGL canvas on
every panel toggle or camera move. `replaceState` keeps the scene alive while
still updating `useSearchParams()` for anything reading it.

It has to be in an effect, not inside the state updater. React may run an
updater during render, and `replaceState` there makes the router set state
mid-render — "Cannot update a component while rendering a different component".
An effect also collapses several updates in one commit into a single history
write.

And it **merges** into what is already in the URL rather than writing over it.
The explorer is not the only thing keeping state there — a tour keeps its slide
in the same query string — and rebuilding the whole query from explorer state
alone silently dropped it. See `lib/explorer/README.md`.

## Simulation time is relative, not absolute

`getSimulationTime()` returns seconds since the clock started, and that is
deliberate. Noise functions take it as a coordinate, and at ~1.79e9 — absolute
epoch seconds — a float32 has worse than 0.1 precision. The cloud shader
multiplies it up further and degenerates to a flat field.

The legacy's `SolarClock.time` had the same relative semantics for exactly this
reason. Note `sun.frag` additionally guards itself with `mod(time, 100000.0)`,
which is why the sun survives large values where the clouds do not.

## Clock mode lives in a ref

The frame path reads `isLive`, the rate and the paused flag from a ref, not
from the closure. With them captured, `setDate` was wiped by the next frame,
which still believed it was live and recomputed from the wall clock.
