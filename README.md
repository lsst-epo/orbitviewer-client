# Orbitviewer

React/Next.js port of `lsst-epo/orbitviewer-client-v2`, using `skyviewer-client` as the architecture reference. The application uses React 19.2.4, Next.js 16.3.0/Turbopack, TypeScript 7.0.2, Three 0.181.0, React Three Fiber 9.7.0, and Drei 10.7.8.

## Local development

Use Node 24 LTS (the exact version is in `.nvmrc`) and Yarn Classic 1.22.22.

```sh
nvm use
corepack yarn@1.22.22 install
cp .env.example .env
corepack yarn@1.22.22 dev
```

The example environment contains the public Craft and Hasura endpoints. Add `CRAFT_SECRET_TOKEN` and `CRAFT_REVALIDATE_SECRET_TOKEN` to enable authenticated preview/revalidation. These values must remain server-only.

```sh
yarn typecheck
yarn lint
yarn codegen
yarn build
yarn start
```

`start` uses port 8080; `bs` builds and serves on port 3000. `static:build` follows the reference repository's script name and creates a regular Next production build, not a static export: Craft previews, API routes, and server data require a Next server.

TypeScript 7 supplies the application compiler. ESLint's TypeScript parser still needs the old JavaScript compiler API, so `scripts/lint-register.ts` redirects its TypeScript imports to the official `@typescript/typescript6` package through the `@typescript/legacy` alias. This redirect applies only to lint/fix processes.

## Organization

- `app/[locale]`: landing page, explorer, guided experiences, tour slides, and Craft content catch-all. English is unprefixed; Spanish uses `/es`.
- `app/api`: public search/catalog proxy, authenticated Craft preview/revalidation, and the co-located Saturn model endpoint.
- `contexts`: translations, explorer state, filtering, playback, selection, and asynchronous search.
- `lib/api/*.graphql` and `gql`: Craft operations and generated documents/types. Run codegen when the schema or operations change.
- `components`: atoms, molecules, organisms, page templates, functional Three renderers and effects. Styling uses CSS modules.
- `lib/solar`: orbital calculations and category definitions. Positions are in AU, epochs in MJD; display radii are enlarged for interaction.

Object details are selected with `?target=<elementID-or-packed-designation>` rather than object routes. Packed catalog IDs and unpacked Craft designations are accepted. A shared target outside the loaded catalog is resolved through Hasura. Share links include the date and camera pose. Tour slides use `/guided-experiences/<tour>/<1-based-step>`; the route without a step opens the first slide.

## Rendering

Small-body orbital propagation uses floating-point render targets and the legacy GPU shaders; devices without float render-target support use a CPU fallback. Catalog changes replace the current quality dataset while retaining search results. The camera, planet materials, Earth clouds/atmosphere, Saturn rings, Sun/field, blur, and composition are independent functional components/modules. Render targets are resized and disposed with their owners.

All 41 source GLSL files were retained byte-for-byte. The importer resolves active custom include lines and leaves commented includes alone. Three supplies its own color-space declarations when constructing a shader material, so that duplicate built-in include is removed at material assembly for the particle fragment. No shader-code generation step or `@fils` dependency remains. Orbit paths use analytic conic geometry with Drei lines.

## Deferred backend work

The requested placeholders remain explicit:

- `lib/globals.ts`: static metadata/settings until matching Craft fields exist.
- `lib/api/hasura.ts`: local planetary orbital elements until the `planet_orbits` table exists.
- `components/celestial-bodies/body`: co-located textures until Craft supplies texture URLs.

Preview and revalidation reject requests when secrets are absent. Their successful authenticated paths need verification with the deployment's configured Craft secrets. No tests framework, CI deployment, or hosting changes are included.

## Verification

The migration was checked with TypeScript, ESLint, Stylelint, a production build, Craft code generation, browser checks of the explorer/localization/tour navigation, and ad hoc orbital assertions (including all 16,384 records in the public low-quality catalog). No Jest, Cypress, or other test framework was introduced. The renderer is an orbital visualization, not a precision ephemeris; the preserved legacy GPU approximations and the bounded CPU conic solver should be considered when comparing very eccentric trajectories.
