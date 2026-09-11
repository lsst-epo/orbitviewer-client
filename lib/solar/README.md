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
`components/effects/composite/README.md`.

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
of the 31 non-planet entries, larger tiers more. The legacy searched
`LoadManager.data.sample` for the same reason.

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
