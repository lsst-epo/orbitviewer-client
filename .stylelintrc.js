export default {
  extends: [
    "stylelint-config-standard",
    "stylelint-config-css-modules",
    "stylelint-config-recess-order",
  ],
  rules: {
    // CSS custom properties are the ported replacement for the legacy SCSS
    // variables in _variables.scss, so kebab-case names are expected.
    "custom-property-pattern": null,
    "selector-class-pattern": null,
  },
};
