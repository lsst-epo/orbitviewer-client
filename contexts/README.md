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

### What each bridge carries

- **Capture.** The share dialog lives outside the Canvas, so it cannot read
  the drawing buffer itself: without `preserveDrawingBuffer` the canvas is
  empty by the time any handler outside the frame looks at it, and turning
  that flag on would cost every frame for a feature used once in a session.
  A request is parked here and fulfilled from inside `useFrame`, immediately
  after the compositor has drawn.
- **Scene controls.** Zoom is **held rather than stepped**, which is what the
  legacy's buttons gave: press and the view keeps moving, release and it
  stops. A click still nudges, because press and release bracket at least one
  frame.
- **Benchmark.** The measurement can only happen inside the render loop, but
  the onboarding dialog that acts on it is DOM.

## The chosen tier and the loaded tier are different things

`quality` changes the moment the reader picks an exploration mode, but
`elements` is still the **previous** tier's rows until the new download lands:
6 MB for the lowest, 97 MB for `high`, so seconds to tens of seconds. The
particle field's capacity has to match its rows, so it is sized from
`datasetQuality` — the tier `elements` was actually loaded for — rather than
from `quality`.

Sized from `quality`, the field is built for the new tier and filled with the
old tier's rows. Going `high` → `low` that is the first 16,384 rows of the
high file, which is **sorted by type** — NEOs, Trojans, centaurs and TNOs, no
main-belt asteroids at all — so the field reads as a wall of NEO purple. Going
back up, it is 14,000 rows in a 262,144-slot field. Both sat visibly under the
loading scrim for the length of the download, and neither throws, nor is it
wrong in any buffer: every per-index check passes, because each buffer is
consistent with the rows it was given. Only the pairing is wrong.

It cannot be reproduced against a warm cache, where the gap is milliseconds.
Delay the new tier's `fetch` to see it. The gap still exists with the fix —
the previous, complete field simply stays up for it.

The graphics tier (glow, blur, clouds) is not tied to the rows and follows
`quality` immediately.

## Search is two-tier, and the worker is not carried over

Tier one is local: the dataset is already downloaded for the scene, so a
substring match over it is instant and needs no network. Tier two queries the
full catalogue through `/api/search`, and runs **only when asked** — it is a
round trip against millions of rows.

The legacy ran tier one in a web worker. That is deliberately not ported: the
work is a single pass of `String.includes` over an array already in memory,
and the worker's own structured clone of that array costs more than the
search does.

## The clock lives in a ref, and setting a rate leaves live mode

The current date is a ref, not state: the scene reads it every frame, and
re-rendering React sixty times a second to carry a timestamp would be
wasteful. A throttled state mirror drives the UI readout.

Setting a rate **leaves live mode**, because the frame path only tracks the
real clock while the rate is zero. Without that the two disagree: the
simulation scrubs away from now while `isLive` still reports true, and the UI
keeps claiming to be live.

## `types` lists what is ON

The inverse of the legacy's own param, which listed the categories that were
off. Listing the inclusions means an unrecognised slug in a share link drops
one category rather than silently enabling it.

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

## Everything else worth knowing

- **Search is debounced**, so typing does not re-scan the dataset on every
  keystroke, and a new query invalidates any catalogue results already on
  screen. An in-flight request is abandoned if the panel goes away mid-search.
  Distance is not expressible in the Hasura query, so it is applied to the
  response for consistency with the local tier.
- **Capture allows one request in flight.** A second supersedes the first
  rather than queueing behind it, since both would return the same frame.
- **The tier is restored after mount.** Reading `localStorage` during render
  would desync server and client markup; a read that throws (private
  browsing, storage disabled) just leaves the default, and a write that
  throws is non-fatal — the choice only fails to persist.
- **Switching tiers mid-download abandons the in-flight request**, rather
  than letting a stale and much larger response land after the new one.
- **Clearing the selection clears the camera view with it.** The view belongs
  to the selection, and a lingering `view=orbit` would frame the next
  object's orbit before it had been asked for.
- **All filters on is the default**, so it serialises as no param at all.
- The clock mirrors into React state on a throttle, for the UI only; the
  frame path reads the ref.
