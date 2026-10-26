# Styles

The global reset, the root font curve and the design tokens. Everything else
is a CSS module beside its component.

## The root font curve is ours, and overrides the library's

`html { font-size: clamp(16px, 1rem + 0.1vw, 24px) }` deliberately overrides
epo-react-lib's `--size-font-16-20`, which is
`clamp(1rem, 0.913rem + 0.4348vw, 1.25rem)` — a steep ramp that hits its 20px
ceiling at a 1240px viewport and stays there. The legacy sets a much gentler
curve and never reaches its ceiling in practice:

```
viewport   epo-react-lib   legacy
1280px     20.00px         17.28px
1920px     20.00px         17.92px
2320px     20.00px         18.32px
```

Left alone, **every rem in the app renders 9–16% larger than the legacy
site's.** The library's ramp is tuned for the Rubin marketing site, not for a
full-viewport app with its own scale; its own components are a handful of
small controls here and take the change without trouble.

## The epo-react-lib boundary

`@rubin-epo/epo-react-lib/styles.css` is three things in one file:

1. a CSS reset — **taken as-is**
2. the `:root` design tokens — **taken as-is**; its components read them
3. a page-level typographic theme — **not taken**

Layer 3 is the theme for the Rubin marketing site: a light page, long
scrolling articles, headings at weight 900 with margins up to 9rem. This app
is a dark full-viewport viewer whose type scale comes from the legacy's, so
layer 3 is wrong here in every particular — which is why the `html` and
`body` rules already override their halves of it.

**Nothing consumes layer 3 deliberately.** Every heading this app renders
carries a class with its own module styles, and `RichText` sets its own sizes
for CMS copy. The element rules only ever applied where a module happened to
omit a property, which made them an invisible fallback producing wrong
answers rather than a design system being inherited — the 404's eyebrow
silently came out at weight 900 that way, and only a computed-style diff
against the legacy site caught it.

So headings are neutralised to plain inherited text and the module that
renders one is the only thing that styles it. `p`, `ol` and `ul` are left
alone: the library guards those with `:not([class])`, so they already stand
aside for anything we render.

## The reset is minimal on purpose

The legacy's was a full normalize pass applied globally. Scoping styles into
CSS modules removes most of the need, so this keeps only what a full-viewport
WebGL app actually requires.

## Where the tokens came from

`variables.css` is a 1:1 port of the legacy's token sheet, with two changes:
the viewport and touch indicator blocks are plain media queries rather than
mixin includes, and **breakpoint values are inlined at each query** — custom
media queries are not available without PostCSS, and Turbopack uses Lightning
CSS.

Component modules `@import` this file rather than relying on global class
aliases, per the port plan.

## Every length token is rem, and the figure is the legacy's px ÷ 16

The legacy authors in px and its build converts the lot to rem against a 16px
base, so the legacy site's whole interface scales with the fluid root font —
a 10px corner radius ships as `0.625rem` and renders 11.45px at a 2320px
viewport.

**Authoring px here would pin this app's chrome at a fixed size while the
legacy site's grew.** The root-font curve these resolve against is in
`globals.css`.

## RGB triples are space-separated

They are consumed by `rgb(… / a)`. The legacy wrote `rgba(var(--x-rgb), .1)`,
where commas were correct.

**Mixing the two is silently fatal.** `rgb(0, 0, 0 / 60%)` is invalid, so the
whole declaration is dropped — which is what removed every border and backdrop
in the app until it was noticed.

## The frozen-glass tokens

The legacy's frozen-glass and gradient-border mixins, which together make
every floating panel in the viewer — the toolbar, the time machine, the object
card, a tour card.

Two stacked gradients rather than a flat tint: a white wash over near-opaque
black, so the panel lifts off the scene without the scene showing through as
colour. The edge is a masked gradient border, brighter at the top than the
bottom, which is what gives the panels their lit-from-above look.

## `--font-stack-base` is epo-react-lib's, and it must be set

The library reads it for everything it renders and **defaults it to Source
Sans Pro** — a different family from the Source Sans 3 this app loads, and one
nothing serves, so it falls through to Helvetica.

This is also why the vendor stylesheet is imported before the project's in
`app/[locale]/layout.tsx`: both set a `body` font-family in a plain
single-element rule, so whichever sheet comes last wins.

## `body` takes `min-height`, not `height`

A sticky element is confined to its parent's box, so a body fixed at one
viewport tall let the content pages' sticky header scroll away the moment the
page was longer than the screen. Nothing relies on `body` being exactly 100% —
the explorer and splash set their own height in `dvh`.

## Object category colours are overwritten at runtime

The tokens are defaults. The real values come from Craft's `objectTypes`
category group at load, matching the legacy's own colour map.
