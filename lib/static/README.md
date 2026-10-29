# Static data

Data that has no home in a CMS or an API yet.

## The planet elements are a stub

Orbital elements for the planets and dwarf planets are hardcoded JSON. They
are destined for a `planet_orbits` Hasura table with a schema mirroring
`mpc_orbits`.

Until that table exists the JSON is returned through an **async signature**,
so the call sites do not change when the real query lands: swap the body for a
Hasura query and nothing upstream needs to move. The two `// TODO:` markers in
`planetOrbits.ts` mark exactly where.

This is also why the planets are not in the MPC dataset at all, and why their
distance range is measured rather than looked up — see `lib/solar/README.md`.
