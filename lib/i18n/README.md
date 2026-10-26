# i18n

Two libraries, split by job: **i18next resolves all copy**, and **next-intl
does locale routing only**. That split matches Skyviewer's and is why the
next-intl provider is given an empty message catalogue — left to itself it
tries to load its own and fails.

## Routing

`localePrefix` is `"as-needed"`, so the default locale drops its prefix:
`/explorer` for English and `/es/explorer` for Spanish. next-intl redirects
legacy `/en/*` paths to their unprefixed equivalent, so existing English URLs
resolve with no extra config.

## One instance per render on the server, a singleton on the client

During compilation everything runs in parallel, so a shared server-side
singleton would **leak language state across requests**. The client has no
such problem and uses a normal singleton.

The catch with a client singleton: it detects its language **once**, from
`<html lang>`, when the module is first evaluated. Switching locale afterwards
is a client-side route change, so nothing re-runs that detection and every
string stays in the language the session started in — a hard load of `/es` was
fine, while switching from the menu left the whole interface in the old
language, the settings row's label included. `contexts/i18next.tsx` therefore
calls `changeLanguage` whenever the route's locale differs from the
instance's, in a layout effect so the switch lands before the new locale
paints.

Not visible on a hard load, so test a locale change with the language menu or
the splash links rather than by typing the other URL.

## The loader map is explicit, and has to be

`index.ts` lists every locale × namespace combination rather than building an
`import()` from a template literal. **Turbopack cannot statically analyse a
specifier with two dynamic segments** (`.../${language}/${namespace}.json`)
and fails the build with "Module not found". Listing them keeps the graph
analysable, and there are only a handful.

The `@epo-locale-strings` specifier is aliased in `next.config.js` — see the
note there about epo-react-lib v3's exports map.

## Craft addresses sites by numeric id

`siteIdFromLocale` maps `en` → `1` and `es` → `2`, as the legacy's own Craft
helper did. Craft has no handle-based addressing here.
