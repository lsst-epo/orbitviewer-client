import next from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";
import common from "./config/common-eslint.ts";

// Carry over the shared team's rules in Next 16's flat config format.
// Removed rules are obsolete ESLint rules or refer to removed test frameworks.
const rules = { ...common.rules };
for (const name of ["jsx-a11y/img-has-alt", "no-unused-semi"])
  delete rules[name];
export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "gql/**",
      "config/common-eslint.ts",
    ],
  },
  ...next,
  ...typescript,
  {
    plugins: { "unused-imports": unusedImports },
    rules: {
      ...rules,
      "no-console": ["error", { allow: ["info", "debug", "error"] }],
      "@typescript-eslint/no-unused-vars": "off",
      "react/no-unknown-property": [
        "error",
        {
          ignore: [
            "args",
            "frustumCulled",
            "userData",
            "raycast",
            "attach",
            "position",
            "rotation",
            "scale",
            "intensity",
            "decay",
            "vertexShader",
            "fragmentShader",
            "uniforms",
            "transparent",
            "depthWrite",
            "map",
            "roughness",
            "color",
            "size",
            "sizeAttenuation",
            "vertexColors",
            "opacity",
            "object",
            "makeDefault",
            "enableDamping",
            "minDistance",
            "maxDistance",
          ],
        },
      ],
    },
  },
];
