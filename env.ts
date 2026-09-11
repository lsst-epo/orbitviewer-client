import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  emptyStringAsUndefined: true,
  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("test"),
  },
  server: {
    /**
     * Deployment tier. Anything other than "prod" is treated as non-production,
     * which is what gates the viewport debug overlay (ported from _debug.scss).
     * Note: the legacy `head.njk` compared against "production" while the SCSS
     * compared against "prod" -- that inconsistency is the known bug the port
     * doc calls out, so "prod" is the single sentinel value here.
     */
    ENVIRONMENT: z.enum(["dev", "int", "prod"]).default("dev"),
    /** Public origin of this client. Used as Metadata.metadataBase. */
    ROOT_DOMAIN: z.url(),
    /** Craft CMS GraphQL endpoint. */
    API_URL: z.url(),
    /** Hasura federated GraphQL endpoint (object search). */
    HASURA_GRAPHQL: z.url(),
    /** Hasura federated REST base (classification ranges). */
    HASURA_URL: z.url(),
    /**
     * Shared secrets with Craft. Intentionally optional so the app boots without
     * them; the routes that consume them fail closed when they are unset rather
     * than letting an empty secret match an empty query param.
     */
    CRAFT_REVALIDATE_SECRET_TOKEN: z.string().min(1).optional(),
    CRAFT_SECRET_TOKEN: z.string().min(1).optional(),
  },
  client: {},
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
  },
});

export const isProduction = env.ENVIRONMENT === "prod";
