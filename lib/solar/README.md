# Solar domain

Orbital mechanics, element normalisation, quality tiers and the curated object
list. Ported from the legacy's `core/solar/` and `core/data/`, converting
module-level functions that leaked `this` into pure ones.

The propagators all write into a caller-supplied `Vector3`. With tens of
thousands of bodies, allocating per call is the difference between a steady
frame time and constant GC pauses — keep it that way.

## Two legacy bugs in the giant perturbations, both fixed here

`applyGiantPerturbations` corrects Schlyter's long-period terms for Jupiter,
Saturn and Uranus. The legacy had two faults in it that **cancelled each other
out**, so its output was accidentally correct-ish and neither was visible:

1. Each block was gated on `this.type` inside a plain exported function. `this`
   is never the element there — under the esbuild IIFE bundle it resolved to
   the global object, so every correction evaluated `undefined === 'jupiter'`
   and never applied.
2. Schlyter publishes these amplitudes in **degrees**, but they were added
   directly to `lonecl`/`latecl`, which `atan2` returns in **radians**.
   Saturn's 0.812 term would have displaced it by 46.5° — roughly 7.7 AU —
   rather than the intended 0.812° (~0.135 AU).

Fixing (1) alone would have introduced a large positional error. Verified
numerically against the legacy: unperturbed bodies are bit-identical, and the
giants now shift by realistic margins.

## A third legacy bug, in the hyperbolic propagator

`hyperbolicCalc` closed `atan()` before multiplying by `tanh(F/2)`:

```js
2 * atan(sqrt((e + 1) / (e - 1))) * tanh(F / 2); // legacy
```

The true-anomaly relation is `tan(v/2) = sqrt((e+1)/(e-1)) * tanh(F/2)`, so
the product belongs **inside** `atan`. As written, the legacy returned a wrong
true anomaly for every hyperbolic body — which is every interstellar object
and every comet on an escape trajectory. It is fixed here.

## An open question in the same function

The legacy uses `DEG_TO_RAD` (0.017453) where the Gaussian constant `K`
(0.017202) is expected, in the mean-anomaly term. The two differ by 1.4% and
sit one letter apart in the source, so this looks like a copy/paste slip
between near-identical constants.

**It is left as written rather than silently corrected**, because it changes
propagation rates for hyperbolic bodies and that is a behavioural change, not
a cleanup. Marked with a `// TODO:` at the line; it needs someone to confirm
against the published method before it moves.

## The iteration cap is enforced here

The legacy declared `E_CONVERGE_MAX_ITERATIONS` and **never referenced it**,
so its Newton-Raphson loops could spin indefinitely on a near-parabolic
ellipse that fails to converge. The cap is applied in this port.

The first-order starting estimate is exact enough on its own for
near-circular orbits, which is why the refinement is skipped below `e = 0.05`.

Algorithms throughout this folder follow Paul Schlyter's _Computing planetary
positions_ (https://www.stjarnhimlen.se/comp/ppcomp.html), and the element
notation matches that paper.

## Frame conversion

`getCartesianCoordinates` maps the ecliptic's z-up frame to three.js's y-up
frame. **The y axis is negated as well as swapped** — without the negation the
handedness flips and every orbit runs backwards.

## Mean anomaly must be normalised

The legacy's `getMeanAnomaly` was unbounded and its `% 360` left negative
angles negative, which put perihelion up to a full period late. `meanAnomalyAt`
normalises to `[0, 360)`.

Both MPC and Hasura return mean anomaly in `(-180, 180]`; the propagators
assume a positive-degree convention, so `fromMpcRow` and `fromHasuraElements`
shift it on the way in.

## Quality tiers

A tier is a GPU simulation texture size — one texel holds one object's computed
position, so width × height caps how many bodies the scene can propagate. It
also selects which MPC dataset is downloaded, and those get large fast:

```
low 6 MB · medium 24 MB · high 97 MB · ultra 194 MB · ultra2 360 MB
```

Measured 2026-09-11, served **uncompressed** from GCS. Enabling gzip/brotli on
that bucket is the single biggest win available on explorer load time and is
still outstanding.

Note `ultra` is 1024×512, not square. `GFXTier`'s renderer settings are a
separate matter and are not as authoritative as they look — see
`components/scene/effects/composite/README.md`.

## Category resolution

`CATEGORY_PRIORITY` decides which category an object displays as when it
carries several type codes. The order is ported verbatim from the legacy's
`getCategory` and is **a product decision, not an arbitrary one** — do not
re-sort it. Code 7 (planets-moons) is deliberately absent, as in the legacy:
planets come from their own dataset, never from `mpc_orbits`.

## Named objects: Craft's category wins

`resolveNamedObjects` matches Craft's curated entries into the loaded MPC
dataset by designation, because the CMS holds no orbital elements. Objects
absent from the loaded file simply do not appear, which is why this is resolved
per dataset on the client rather than on the server — the low tier carries 22
of the 31 non-planet entries, larger tiers more. The legacy searched its own
loaded sample for the same reason.

Where Craft has a category it wins over the dataset's. The legacy deferred to
the dataset and reached for Craft only when a row's `object_type` was `[0]`, a
distinction this port cannot make after `fromMpcRow` has resolved an
unclassified row to "asteroids". Checked against the live data before settling
on it: across the 22 entries the low tier carries, the two never disagree where
both hold a value, and the five that differ are exactly the `[0]` rows — among
them Ka`epaoka`awela and Arrokoth, which would otherwise draw as plain
asteroids rather than a Trojan and a TNO.

Matching is **case-sensitive**: MPC packed designations encode their cycle
count in base 62, where `A` is 10 and `a` is 36, so `K15Bo9Z` and `K15BO9Z` are
different objects.

## `id` vs `shareId`

`NamedObject.id` is the element's own id — the packed designation (`J99R36Q`),
since `fromMpcRow` prefers `mpcdesignation`. `shareId` is Craft's `elementID`,
the unpacked form (`1999 RQ36`), and is what goes in the URL.

They have to be different. The scene resolves either, but the server cannot:
`generateMetadata` has the Craft entries and no dataset to resolve against, so
a packed id in the URL finds no entry and the share card falls back to the bare
designation instead of the object's name. Putting the editorial identifier in
the URL is also what the legacy did, by routing these to `/solar-items/<slug>/`.

## Identifiers and ranges

`fromMpcRow` prefers the **packed** designation — compact, space-free, and
what the legacy put in its `?id=` param — falling back to the unpacked form
when a row lacks one.

Category distance bounds are collected **independently** rather than requiring
a pair. The table is not uniformly populated: comets report a minimum with no
maximum, and interstellar objects have no rows at all, so requiring both would
silently drop a whole category from the totals. The planets come from their
own dataset, so their range is measured rather than looked up.

## Tier selection

A touch device gets the smallest dataset regardless of how fast it renders,
because the constraint there is the download rather than the GPU.

`ultra2` exists as a simulation size only — the legacy's table stopped at
`ultra` — so it inherits `ultra`'s renderer settings.

When storage refuses to persist the chosen tier, that is treated as
**"chosen"**. The choice cannot be remembered either way, and asking on every
single visit would be worse than not asking at all.

## The speed curve

Slider travel is **cubic** in the rate. The legacy mapped the track linearly
onto −1000…1000 and rounded to whole hours, which made the useful part of the
range unreachable: on a ~300px track one pixel was ~7 hours per second, so a
rate below that could not be picked at all — yet its own label formatter has
an hours tier and prints one decimal, so fine rates were clearly intended.

Cubing gives even resolution across four orders of magnitude: a tenth of the
travel reaches 1 hour per second, half reaches 125, and the end reaches 1000.

There is a **dead zone** either side of centre that still means real time.
Without it the rate is merely very small rather than zero near the middle,
and "live" becomes impossible to hit by dragging. See
`components/molecules/TimeMachine/README.md` for what that implies for the
slider's own state.

## Derived figures take their date as an argument

The closest approach, distance from the Sun and distance from Earth all take
a reference date rather than reading a global clock, so the detail panel can
show figures for the **simulated** date. The legacy hardcoded `new Date()` in
all three, which meant scrubbing the time machine left those numbers stale.
