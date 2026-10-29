# Benchmark

Samples frame times from inside the render loop, so the onboarding dialog can
recommend a quality tier.

## It runs below the compositor

`BENCHMARK_PRIORITY` is `-3`, beneath every other frame subscriber. The delta
it reads is therefore the one for a frame that has been **fully drawn** —
sampling above the compositor would time a frame with the expensive part still
ahead of it, and recommend a tier the machine cannot hold.

## Touch devices skip the result

They get the smallest dataset whatever they benchmark at. A phone can post a
respectable frame time on an empty-ish scene and still have nowhere near the
memory for a 360 MB download; the frame rate is not the binding constraint
there.

## When this runs

The measurement is taken while the reader is still reading the onboarding
copy, so the recommendation is ready by the time they look for it — see
`components/organisms/Onboarding/README.md`.
