# Explorer URL state

The `/explorer` search params are the source of truth for what the scene is
showing. Everything shareable lives here: the selected object, the open panel,
the camera framing, the date and speed, and the filters.

## The legacy's share-link scheme is deliberately not accepted

`generateShareableURL()` used terse keys with ad-hoc encodings. None are
parsed — an old share link still resolves to `/explorer`, it just opens at
defaults. The mapping, for anyone tracing an old link:

| legacy     | current     | note                                                              |
| ---------- | ----------- | ----------------------------------------------------------------- |
| `d`        | `date`      | ISO 8601, colons intact                                           |
| `ts`       | `timeScale` | hours per second                                                  |
| `cp`, `cq` | `camera`    | was two params, now underscore-joined                             |
| `db`       | `discovery` | `all` / `rubin` / `other`; was an integer enum                    |
| `ntypes`   | `types`     | comma-joined **included** categories; was `+`-joined **excluded** |
| `dr`       | `distance`  | `min,max` AU; was `min-max`, ambiguous for negatives              |
| `id`       | `object`    |                                                                   |

Parsing is loose on purpose: an unparseable param falls back to its default
rather than erroring the page, so a mangled share link still renders the scene.

`mergeExplorerParams` deletes only the keys this module owns, so params it does
not know about — a tour's `slide`, for one — survive a scene update. Rebuilding
the whole query string instead drops them.

## The default camera framing depends on the body

`defaultViewFor` lives here, beside the param it defaults, because **two places
have to agree on it**: the scene, and the detail panel's camera-view toggle.
They did not. The toggle read `params.view ?? "object"` independently and so
sat on "Object" while the scene framed the orbit.

The rule is the legacy's: it frames a body on its orbit unless the body is a
planet, and its planet flag is true only for the eight. Everything else — dwarf
planets included — is framed on its orbit.

That is not arbitrary. Those eight are the only bodies carrying a texture, so
they are the only ones worth flying up to; fly up to Chiron or Bennu and all
there is to see is an untextured sphere.

## Objects are keyed two ways, and the server only knows one

Craft stores the **unpacked** designation (`1999 RQ36`). An element's `id` is
the **packed** one (`J99R36Q`), because `fromMpcRow` prefers `mpcdesignation`.

`resolveObject` matches either, so the scene does not care. The server does:
`generateMetadata` has the Craft entries and no dataset to resolve against, so
a packed id in the URL finds no entry and the share card falls back to the
site default instead of the object's name.

Two consequences, both load-bearing:

- The scene puts Craft's `elementID` in the URL when selecting a named object
  (`NamedObject.shareId`), so shared links resolve server-side.
- `resolveCraftFor` tries every identifier a resolved object answers to, not
  just the raw parameter, so a packed id arriving from anywhere still finds its
  Craft entry client-side. The raw parameter is tried first, so a hand-written
  link against Craft's own id resolves before the dataset has loaded.

Matching is case-sensitive first: MPC packed designations encode their cycle
count in base 62, where `A` is 10 and `a` is 36. The case-insensitive second
pass exists only so links produced while the id was being lowercased still
resolve, and can be removed once none are expected in circulation.

## Writing params

URL writes happen in an effect on the params object, never inside a state
updater. Writing history during render produces "Cannot update a component
(Router) while rendering a different component".

Parsing retries **field by field**, dropping only what failed, so one bad
param does not discard the rest of a share link.

## The share image

A missing overlay costs the branding, not the whole image. The snapshot's
aspect ratio is the viewport's and rarely matches the target, so it is drawn
cover-and-centred — the overflow is cropped rather than the image squashed.
