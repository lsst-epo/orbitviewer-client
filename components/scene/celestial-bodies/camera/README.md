# Camera

Scene camera and controls, ported from the legacy Eleventy app. The legacy
hand-rolled pointer, wheel and pinch handling on top of three's OrbitControls;
drei's `<OrbitControls>` covers all of that, so this keeps only what was
genuinely bespoke — the distance limits, the damping feel, and following a
target.

## drei only updates the controls while they are enabled

The single most important thing to know here, and the cause of two separate
reported defects.

```js
// @react-three/drei, OrbitControls
useFrame(() => {
  if (controls.enabled) controls.update();
}, -1);
```

This component sets `enabled = false` during a flight, to keep the pointer out
of an animation in progress. With drei's check, that meant the controls were
never updated for the flight's duration and the camera could not move at all:

- selecting a body opened the panel, held perfectly still while the distance
  limits eased down unseen, then snapped the whole way in on the single frame
  `enabled` flipped back to true;
- with the clock wound up, the easing pivot never got within
  `ARRIVAL_THRESHOLD` of a fast-moving body, so `enabled` stayed false
  indefinitely and the camera stopped following altogether. Pausing let the
  pivot close the gap, flipped `enabled`, and snapped the body back to centre.

The legacy has no equivalent because `CameraManager.update` sets
`controls.enabled` and then calls `controls.update()` regardless — **`enabled`
gates input handling in three's OrbitControls, not the update.**

`driveControls` therefore drives the update when drei will not, so the controls
still update exactly once a frame and damping is applied once.

## The elastic tether is deliberate

Following eases the orbit pivot onto the body:

```js
controls.target.lerp(target.position, FOLLOW_EASING); // 0.036
```

The lag this leaves is the point, and it is load-bearing. A plain lerp closes a
fixed fraction of the gap each frame while the body opens a fresh one, so the
gap settles at about `v(1-a)/a` — some 27 frames of the body's motion.
Invisible at real time, and widening with the clock. That is the elastic tether
the legacy has: wind the speed up and the planet pulls away from the camera,
slow down or pause and the camera glides back onto it. `CameraManager.update`
gets it from this one line and nothing else — there is no spring and no
velocity term.

**It reads like a lag bug and it is not.** Cancelling it by carrying the body's
per-frame displacement into the pivot was tried: it does pin the planet dead
centre, and it ruins the feel, because the pivot then jumps by the body's whole
displacement every frame and the planet holds still while the entire background
jerks around it. Smooth camera and drifting planet is the trade the legacy
makes, and it is the right one.

## Frame ordering

`CAMERA_PRIORITY` is `0.5`, which puts this after the bodies (priority 0) and
before the compositor (priority 1).

Following reads a position that a `Body` writes in its own frame callback. Both
originally sat on R3F's default priority of 0, where subscribers run in
subscription order — and `<Camera>` is rendered above the bodies in the scene,
so it subscribed first and always ran on stale positions. Invisible at real
time; proportional to clock speed otherwise.

The fractional value is deliberate. Any priority above zero normally hands
rendering over to the subscriber, but the compositor has already taken that on,
so slotting between the two is safe.

## Why the fly-to starts by collapsing maxDistance

Following works by easing `controls.maxDistance` down onto the body until
OrbitControls pulls the camera in against it. But the limit starts at
`CAMERA_LIMITS.max` — three million units — while the camera sits about eleven
thousand out, and **a ceiling above the camera's own distance clamps nothing.**
So the first stretch of the ease was inert:

```
3,000,000 -> 11,180   153 frames   2.5s   nothing can happen
11,180    ->     12   186 frames   3.1s   the actual flight
```

Two and a half seconds with the panel open, the body selected and the view
perfectly still. `framedTarget` collapses the ceiling onto the camera's current
distance the moment a target is taken, which skips exactly the values that
could not have moved it and leaves the flight itself untouched.

## Leaving the splash

`LANDING_CAMERA_POSITION` is where the splash frames the system from, about
2.6x closer in than the explorer's own framing. Leaving the splash flies out
to `DEFAULT_CAMERA_POSITION`.

That flight **reuses the recentre glide** rather than adding a second camera
animation: it eases to exactly the position wanted, and the legacy calls its
own recentre here, which is the same gesture the recentre button makes.

It happens once per visit, and it cannot key off the `landing` flag alone.
The canvas now outlives the route, so the reader can go back to the splash
and forward again — re-running the flight each time would throw away whatever
they had framed. The legacy never had to decide this; its splash was one-way.

The initial vantage point is set once on mount rather than through
`<Canvas camera>`, so remounting the controls does not snap the view back.

## The first frame

The initial position is applied in a **layout effect**, and it has to be one.
R3F creates the camera at `(0, 0, 5)` and starts its render loop as soon as the
canvas exists. The Sun's radius is about 4.65 scene units, so from there it
fills the entire view, and a plain `useEffect` runs after paint: a frame can be
drawn in between. That frame is the Sun pressed against the lens, followed by a
jump out to the real vantage point.

A layout effect runs inside the same commit that mounts the scene, so no frame
sees the placeholder position. It is a race, not a certainty: in a throttled or
backgrounded tab the passive effect always wins and the flash never shows, so
it cannot be reproduced there. Do not move this back to `useEffect` on that
evidence.

## Recentre, zoom and deselection

- **Recentre is ignored while a body is followed.** The camera is already
  framing what the reader asked for, and the legacy's own recentre likewise
  only reset the zoom level in that case.
- **Held zoom moves the camera along its line of sight**, rather than going
  through OrbitControls' own dolly, which is private in three's build and not
  reachable from here. Taking manual control cancels a glide in progress
  rather than the two fighting each other, and control is handed back only
  once the pivot has essentially arrived — dragging mid-flight fights the
  easing.
- **Deselecting returns the pivot to the Sun**, as the legacy does. Without
  it the camera keeps orbiting wherever the last body was: deselect Eris and
  you are left circling an empty point 68 AU out.
- **Panning is disabled.** Panning away from the Sun loses the frame of
  reference, and the legacy's controls did not offer it either. It also means
  nothing competes with the pivot being moved for you.

Damping gives the drift the legacy applied by lerping toward its target every
frame.

## Scale notes

- Distances are scene units, where 1000 units = 1 AU.
- `CAMERA_CLIP` spans 0.01 to ~8,000,000, far too wide for a 32-bit depth
  buffer. The logarithmic depth buffer on the `<Canvas>` is what makes the
  range usable; removing it brings back z-fighting across the whole scene.
- `FRAMING` is relative to the body's own radius, ported from the legacy's
  locked-object distance, so a planet and a kilometre-wide asteroid fill a
  comparable part of the screen.
- `ZOOM_SPEED` ramps over the same 0–10,000 unit span the legacy used. A fixed
  step crawls at the edge of the system and overshoots near a planet.

## The default position is rotated 90° from the legacy's own constant

`DEFAULT_CAMERA_POSITION` is `(10000, 5000, 0)`, which is **not** what
`CameraManager`'s `defaultPos` says. That constant is `(0, 5000, 10000)`, but
nothing ever reaches the camera through it directly -- `centerView` tweens the
components across:

```ts
gsap.to(this.lockedCam.position, {
  z: defaultPos.x, // 0
  y: defaultPos.y, // 5000
  x: defaultPos.z, // 10000
});
```

So the legacy site — the Eleventy app as deployed in October 2026 — settles
at `(10000, 5000, 0)`: the same 11,180-unit distance,
the same polar angle, and an azimuth a quarter turn away. It reads as a
different shot entirely, because it decides which arc of the belt is in frame
and which outer bodies get labels near the edges.

This is almost certainly a slip rather than a decision, but it is what ships
and what every share link and screenshot of the legacy site is framed on, so the
port matches the rendered result rather than the constant. **If upstream ever
straightens the swizzle, this value follows it back to `(0, 5000, 10000)`.**

Worth knowing when comparing the two apps: a 90° azimuth change leaves radial
distances from the Sun almost unchanged for some bodies and halves them for
others, depending on each body's heliocentric longitude. Comparing one pair of
planets is not enough to tell a rotation from a zoom -- compare several bodies
spread around the ecliptic, or the projected width of a near-circular orbit,
which is azimuth-invariant.
