import "./env.config.js";
import type { CodegenConfig } from "@graphql-codegen/cli";
import { env } from "./env";

const config: CodegenConfig = {
  generates: {
    "./gql/": {
      documents: [
        "app/**/*.{ts,tsx}",
        "lib/api/**/*.{ts,tsx,gql,graphql}",
        "components/**/*.{ts,tsx}",
      ],
      preset: "client",
    },
  },
  config: {
    useTypeImports: true,
    avoidOptionals: true,
    // Craft's custom scalars. Left unmapped they generate as `{}`, which is
    // assignable from anything and useful for nothing -- `tour.duration ?? 0`
    // does not even typecheck as a number.
    scalars: {
      DateTime: "string",
      Number: "number",
      QueryArgument: "unknown",
    },
  },
  schema: env.API_URL,
  ignoreNoDocuments: true,
};

export default config;
