# Debug viewport

A dev-only readout of which breakpoint and input mode the stylesheets are
actually resolving. Ported from the legacy Eleventy app.

It reads the `--viewport` and `--touch` custom properties that
`styles/variables.css` sets per breakpoint, rather than re-deriving the
breakpoint in JavaScript — so it reports what the CSS resolved, not what a
second implementation of the same media queries thinks it should have.

## The legacy compared against two different sentinels

The legacy tested `ENVIRONMENT` against `"production"` in the template that
emitted the element, and against `"prod"` in the stylesheet that styled it. One
of the two was always wrong, which is the known bug the port plan called out:
the element was emitted but styled in no environment at all, or the reverse,
depending on which value the build set.

There is one sentinel here, `isProduction` from `@/env`, and the component
returns `null` rather than rendering something the stylesheet then has to hide.
