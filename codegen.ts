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
  },
  schema: env.API_URL,
  ignoreNoDocuments: true,
};

export default config;
