import { loadEnvConfig } from "@next/env";
import type { CodegenConfig } from "@graphql-codegen/cli";
loadEnvConfig(process.cwd());
const config: CodegenConfig = {
  schema: process.env.API_URL,
  documents: ["lib/api/**/*.graphql"],
  generates: { "gql/": { preset: "client" } },
};
export default config;
