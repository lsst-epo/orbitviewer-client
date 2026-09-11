import { fileURLToPath } from "url";
import { createJiti } from "jiti";
import createNextIntlPlugin from "next-intl/plugin";

const __filename = fileURLToPath(import.meta.url);
const jiti = createJiti(__filename);

const { env } = await jiti.import("./env");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js writes its own AGENTS.md / CLAUDE.md into the repo root for AI
  // agents. Disabled because this team keeps agent context in a separate
  // repo (lsst-epo agentic-context-docs), and a generated file of the same
  // name at the project root is easy to mistake for that convention.
  //
  // If we ever colocate the agent context files in this repo, flip this back
  // to true -- the generated block is fenced with BEGIN/END markers and sits
  // alongside hand-written content without clobbering it.
  agentRules: false,
  images: {
    remotePatterns: [
      // Craft-hosted assets (element previews, page imagery, tour thumbnails).
      { protocol: "https", hostname: "api.orbitviewer.app" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
  turbopack: {
    resolveAlias: {
      // epo-react-lib v3 moved its locale strings under dist/ but its exports
      // map only covers the bare "./localeStrings" directory -- the "./*"
      // wildcard appends ".js", so no JSON subpath resolves. Alias straight
      // at the real files until the package exports them.
      "@epo-locale-strings/*":
        "./node_modules/@rubin-epo/epo-react-lib/dist/localeStrings/*",
    },
    rules: {
      // GLSL is imported as raw source and handed to three's ShaderMaterial.
      // This replaces the legacy `scripts/build/glsl.js` codegen step, which
      // generated a Shaders.ts barrel file of string imports.
      "*.glsl": { loaders: ["raw-loader"], as: "*.js" },
      "*.vert": { loaders: ["raw-loader"], as: "*.js" },
      "*.frag": { loaders: ["raw-loader"], as: "*.js" },
    },
  },
  async redirects() {
    return [
      // Legacy per-object detail pages are now a panel on /explorer driven by
      // the `object` search param. 308 so the link equity on the 45 indexed
      // solar-items URLs carries over. Next appends any other incoming query
      // params to the destination automatically.
      {
        source: "/solar-items/:slug",
        destination: "/explorer?object=:slug",
        permanent: true,
      },
      {
        source: "/:locale/solar-items/:slug",
        destination: "/:locale/explorer?object=:slug",
        permanent: true,
      },
      // Legacy generic object detail route, keyed by ?id=.
      { source: "/object", destination: "/explorer", permanent: true },
      {
        source: "/:locale/object",
        destination: "/:locale/explorer",
        permanent: true,
      },
      // Legacy objects list, now a panel on /explorer.
      { source: "/objects", destination: "/explorer", permanent: true },
      {
        source: "/:locale/objects",
        destination: "/:locale/explorer",
        permanent: true,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

export default withNextIntl(nextConfig);
