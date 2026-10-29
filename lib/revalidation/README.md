# Revalidation

Maps a Craft URI to the routes that render it, for every locale, so an
editorial change reaches the right pages.

About and How to Use are served by the `[...uriSegments]` catch-all, so their
Craft slug is the path. Landing renders at the locale root.

Section-level tags are revalidated as well as the entry's own, so list pages
pick up the change too.

## `cacheLife` is required now

Next.js 16 requires a `cacheLife` profile on `revalidateTag`. `"max"` expires
the entry outright, which is what the previous single-argument behaviour did.
