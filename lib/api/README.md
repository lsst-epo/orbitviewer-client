# API clients

Three sources, each with its own module: Craft CMS over GraphQL (`craft.ts`,
`client.ts`), Hasura over REST (`hasura.ts`), and the MPC orbital datasets
fetched straight from Google Cloud Storage (`mpcData.ts`).

## Craft and Hasura run on the server; the datasets do not

`client.ts` reads the endpoint from a non-public env var, so it is never
bundled for the browser.

Hasura is the more important case. **The legacy shipped `HASURA_SECRET_KEY` to
the browser** via an esbuild `define` and sent it as an `X-Hasura-Admin-Secret`
header from page JS. The proxy no longer requires that header, and keeping
these calls server-side means neither the endpoint nor any credential reaches
the client bundle. Do not move them.

`getA()` and `fetchSolarElements()` are **not ported**: both were unreachable,
and their endpoints now 404 on the proxy.

The MPC datasets are the exception and are fetched by the browser directly
from GCS, as the legacy did. They are far too large to proxy through the
Next.js server or to embed in an RSC payload — 6 MB at the smallest tier,
over 340 MB at the largest, served uncompressed. The URLs come from Craft, so
which file each tier points at stays editorially controlled.

## Name-only rows are dropped on the way in

**About 14% of the dataset cannot be drawn.** In the low tier, 2,380 of
16,384 rows carry a designation and nothing else: `a`, `e`, `q`, `i`, `node`,
`argperi`, `mean_anomaly`, `mean_motion`, `peri_time` and `epoch_mjd` are all
null, leaving only `fulldesignation`, `mpcdesignation`, `object_type` and
`rubin_discovery`. Every one is a comet — 2,380 of the 3,002 comets in that
tier, so **79% of comets in the dataset are stubs**.

`hasOrbitElements` drops them in `loadMpcDataset`, before anything sees them.
Filtering here rather than at each consumer is deliberate: an object with no
elements cannot be propagated, framed, drawn or measured, so there is no
consumer for which it is valid. One guard at the boundary is the whole fix,
and it keeps `OrbitElements` honestly non-nullable downstream.

**The port had no such guard**, and the rows reached everything. They crashed
the search panel, which renders `element.a.toFixed(2)`; the shared filter
predicate let them through because its distance test is skipped entirely when
no distance filter is set, where the legacy's always ran.

### The test is narrower than the legacy's, on purpose

The legacy skipped a row when `a`, `mean_anomaly` **or** `mean_motion` was
null. Copying that verbatim is wrong here, because it conflates two unrelated
groups:

| rows  | what they have                                     | what they are                           |
| ----- | -------------------------------------------------- | --------------------------------------- |
| 2,380 | nothing at all                                     | name-only stubs                         |
| 210   | everything except `mean_anomaly` and `mean_motion` | unbound orbits, `e` from 1.0000 to 6.14 |

**A mean motion does not exist on an unbound orbit** — the body never
returns, so there is no period to average over. Those 210 rows are complete;
`hyperbolicCalc` propagates them from `Tp`, and `buildOpenArc` draws them.
The legacy excluded them because it drew nothing for unbound orbits at all
(see `components/scene/effects/orbital-path/README.md`); this port added that
capability deliberately, so taking the legacy's test wholesale would have
silently removed every hyperbolic comet in the catalogue.

So the test is `a !== null`, which isolates the stubs exactly. `M` and `n`
fall back to zero for the unbound rows, where the propagator never reads
them.

### Why the object count does not match the row count

The explorer's HUD reports **14,004** objects on the low tier where the file
holds 16,384 rows. The difference is exactly the stubs. The count is of
objects that exist in the scene, which is the only figure that matches what a
reader can see, search for or select.

Two other counts in this app are deliberately different again, and comparing
them will mislead:

- The **splash figure** is `rubin_discoveries_count`, an editorial number
  published in the file's head — see below. It is not a row count of
  anything.
- **Hasura's catalogue** is the full MPC set, far larger than any tier's
  file, so a catalogue search can return objects the loaded scene does not
  contain.

## The download is streamed so it can report progress

A 6–340 MB fetch with no readout looks stalled. `readWithProgress` streams the
body and falls back to a plain read when the body is not streamable or no
length is advertised.

## The discovery count is a range request, not a download

The splash counts up to `rubin_discoveries_count`, which lives in the **head**
of a dataset file — it is the first key of the object, ahead of the
`mpc_orbits` array, so 256 bytes is generous cover. Fetching it as a range
request means the splash does not pull a file that runs to 343 MB. A server
that ignored the range would answer `200` with the whole body, so anything but
`206` is abandoned unread.

**It is an editorial number, not a row count.** 35,000 today, the same in
every tier's file. Asking Hasura for `count(*) where rubin_discovery` gives a
different answer — that counts flagged rows in the catalogue, a different
quantity that nothing in the legacy ever showed.

## Craft's page types are one union

The legacy's `getAbout()` / `getHowToUse()` helpers queried root fields
(`aboutEntries`, `howToUseEntry`) that no longer exist in the schema. The
working path is `pagesEntries`, which returns About, How to Use and Landing as
a single union, and that is what is ported.

## `MpcOrbitRow` lives here, beside the fetch

Snake_case throughout, because it mirrors the wire format verbatim. It is here
rather than in `lib/solar` so the domain modules hold only normalised shapes.
Its field names coincide with the Hasura `mpc_orbits` columns.

The pairing with `lib/solar/elements.ts` creates **no runtime import cycle** —
the import there is type-only and is erased at compile time.
