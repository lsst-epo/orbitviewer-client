export default {
  extends: ["stylelint-config-standard", "stylelint-config-css-modules"],
  rules: {
    "selector-class-pattern": null,
    "custom-property-pattern": null,
    "font-family-name-quotes": "always-where-recommended",
  },
  ignoreFiles: ["node_modules/**", ".next/**"],
};
