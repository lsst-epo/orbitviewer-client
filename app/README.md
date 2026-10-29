# App router

Routes, layouts and the API handlers. Everything Craft-backed is resolved by
slug; everything scene-backed lives under the `(viewer)` group.

## `(viewer)` exists to keep one canvas alive

Everything inside it is drawn over **one live scene**, as the legacy drew its
splash, its guided experiences and its object pages over a canvas that never
unmounted. The group is a routing device only — it does not appear in any URL
— and exists so React can keep that canvas, and the orbital data behind it,
mounted across these four routes.

The orbital data is fetched in the group's layout rather than per page, for
the same reason: one request, shared. **The MPC dataset proper is not in that
payload**, being far too large; only the URLs the browser fetches it from are.
See `components/templates/Viewer`.

## `(explorer)` exists to keep one Explorer alive

A second group, nested inside `(viewer)`, holds the two routes that show the
explorer interface — `/explorer` and `/guided-experiences/[tour]/…` — and
mounts `<Explorer>` in its layout.

Before this, each of those pages mounted its own `<Explorer>`. The canvas
survived a navigation between them because it lives higher up in `Viewer`,
but **everything else was torn down and rebuilt**: the chrome, the panels and
all of the template's local state. Sharing a layout means the Explorer subtree
is mounted once and only the overlay swaps.

The two pages are therefore thin. Each keeps its own metadata — and the tour
keeps `generateStaticParams` — but `/explorer` renders `null`, and the tour
renders its `TourPlayer` alone. Whatever a page returns lands in Explorer's
overlay slot.

**The splash and the tour index stay outside the group.** They are in
`(viewer)`, so they get the canvas, but they are not the explorer and must not
inherit its chrome. That is also why the group cannot simply be `(viewer)`
itself.

Two consequences worth knowing:

- `/guided-experiences` and `/guided-experiences/[tour]` now come from
  **different folders**. Route groups are erased from the URL, so the paths
  are unchanged and do not collide — the build's route table is identical —
  but the index and the tour are no longer siblings on disk.
- The layout fetches the featured tours for onboarding, so a tour route pays
  for one Craft query it does not use. It is a cached query on a route that
  prerenders, which is cheaper than the remount it replaces.

A page inside `(viewer)` otherwise fetches only what is its own — the explorer
group's layout fetches what onboarding needs, and a tour fetches the tour.

## The content pages are one catch-all

`[...uriSegments]` serves About and How to Use. Craft's `pages` section
returns About, How to Use and Landing as **one union keyed by slug**, so the
URI is matched straight against the entry slug; Landing is excluded because it
renders at the locale root instead.

Those entries are narrowed on `__typename` — the page types share no field
beyond the interface, so it is the only thing identifying which one a given
entry is. The same is true of Craft's section unions elsewhere: they admit
nulls and members without a slug, and a tour without a slug has no URL and so
cannot be listed.

`generateStaticParams` prerenders them, which costs nothing in freshness
because they are revalidated by tag from `/api/revalidate`. Anything not
listed still renders on demand.

## A tour slide out of range opens the tour anyway

Rather than 404ing. A deck can shrink when an editor republishes, and a link
to a slide that no longer exists should still open the tour at its first
slide.

## The root layout

Three things in it are load-bearing:

- **Vendor styles are imported before the project's.** epo-react-lib sets
  `--font-stack-base` and a `body` font-family in its own `:root`, both plain
  single-element rules, so whichever sheet comes last wins. The wrong way
  round renders the whole app in Helvetica — see `styles/README.md`.
- **Page zoom is disabled.** The explorer is a full-viewport WebGL canvas, and
  zooming the page fights the scene's own pinch handling.
- **The next-intl provider wraps everything**, on the server and again on the
  client. Without it the locale-aware navigation helpers throw "No intl
  context found" the moment they render. Its messages are deliberately empty:
  next-intl does routing only here, and all copy comes from i18next — see
  `lib/i18n/README.md`.

It also mounts epo-react-lib's **styled-components registry**. In the App
Router those styles must be collected during the server render and injected
into the streamed HTML, or the client generates class names that do not match
and React reports a hydration mismatch. The registry is exported by the
library so it uses the library's own styled-components instance — **we must
not add styled-components as a dependency of our own**, or there would be two
copies and the styles would silently stop resolving.

## 404

Two things the legacy does here that this does not, both deliberate.

**No scene.** The legacy renders the 404 over the live viewer and drifts the
camera up to a random planet behind the type — it can afford to, being a
single-page shell whose canvas never unmounts. Mounting the canvas here would
mean loading the MPC dataset to render an error page. The scene backdrop is
the same decision the splash and the tour list are waiting on, and belongs
with them rather than being settled three times.

**No full navigation.** This uses `ContentHeader`, as About and How to Use do.
Offering "share" on a page that is nothing but an error is not worth matching.

`not-found.tsx` is not passed `params`, so the locale comes from the request
rather than the route.

Its stylesheet keeps the legacy's entrance: the three pieces rise from
`translateY(100)`, staggered 0 / 0.2 / 0.5s over 0.8s, which `globals.css`
disables under `prefers-reduced-motion` along with every other animation in
the app. The backdrop stays a **scrim rather than a fill**, as the legacy's
is, even though no scene is mounted behind it — that is the same pending
decision as above, and the scrim is what it will want.

The title is weight 900 and full-bleed, the loudest type in the app; the
eyebrow above it inherits the body's regular weight, which is what the legacy
renders. See `styles/README.md` for why that needed defending.

Below the legacy's `large` breakpoint the block sits centred with the button
pinned low; at and above it the pair is centred together.

## API routes

- **`/api/preview`** starts a Craft draft-mode session. It **fails closed**:
  with no configured token nothing validates. It redirects to a path derived
  from the entry, **never to a caller-supplied URL** — that would be an open
  redirect.
- **`/api/revalidate`** fails closed the same way, rather than letting an
  empty secret match an empty query param.
- **`/api/search`** takes category slugs and returns MPC type codes.

## The discovery figure on the landing route

Read from the head of the MPC dataset, which is where the legacy reads it.
Any tier's file carries the same number, so the smallest is asked for — and
only its first 256 bytes are actually read. See `lib/api/README.md`.
