# Viewer shell

The persistent viewer shell: **one WebGL context and one copy of the orbital
data**, shared by every route that shows the scene.

## Why it exists

Because of what the scene costs to start. The MPC dataset is 6 MB at the
lowest tier and 360 MB at the highest, served uncompressed
(`lib/solar/quality.ts`), and the _browser_ downloads it rather than the
server. Mounting the canvas per route would pay that again on every
navigation between the splash, the explorer and a guided experience.

The legacy got this for free by being a single page whose canvas never
unmounted. The App Router equivalent is a layout: `/`, `/explorer`,
`/guided-experiences` and a tour are siblings inside the `(viewer)` route
group, so React keeps this subtree mounted as the reader moves between them
and only the overlay below `children` is swapped.

It also moves the download somewhere useful. **The splash is the one screen a
reader dwells on without needing anything yet**, which is exactly when the
dataset should be arriving — an earlier pass of the port waited for the click
and then showed a progress bar.

## Search params come from the hook, not a prop

Because a layout is not passed `searchParams` — only a page is. The provider
seeds its state from this once and owns it thereafter, so reading it here is
equivalent to the prop the pages used to pass down.

`useSearchParams` requires a Suspense boundary, or the production build fails.

## The shell owns the viewport

`100dvh` and `overflow: hidden` live here rather than on each route, so the
canvas keeps one size as the overlay above it is swapped.

**Every child of the shell is an overlay over the canvas**, which is
absolutely positioned and therefore paints above anything in normal flow. A
route that is a scrolling document — the tours list — has to say so, and to
own its own scrolling, since the shell clips at the viewport.

The splash link is locale-stripped, so it is `/` in either language.
