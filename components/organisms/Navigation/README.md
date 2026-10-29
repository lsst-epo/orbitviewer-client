# Navigation

The share trigger and the settings menu. Ported from the legacy Eleventy app.

## The scene-dependent items are only rendered where there is a scene

The legacy rendered this on every page but wired it only where the viewer
existed, so on About and How to Use the exploration-mode and fullscreen
controls were present, focusable, and did nothing.

Here `quality` and `onShare` are optional and their sections disappear with
them. Language is always present, so the group always has something in it.

## Fullscreen state comes from the document, not from us

Fullscreen can be left by pressing Escape, which fires no click of ours — so
the label is driven by the document's own fullscreen state rather than by
local state that would silently go stale.

## Focus and the two levels

- Opening the share dialog **closes the menu**. The dialog is modal, so
  leaving the menu open behind it would strand focusable controls underneath an
  overlay.
- Closing the menu returns focus to whatever opened it, or it would be lost to
  the document body. The legacy left it wherever it happened to be.
- The second level is an implementation detail of being open: closing the menu
  resets it rather than leaving it to be reopened mid-way down.
- The glyph does not change when the menu opens. The legacy leaves the
  hamburger in place and marks the state with the focus ring.

## Switching locale

Same route, other locale — next-intl rewrites the path. The legacy called a
global `changeLang()` that reloaded the whole document.

`localeKey` maps `en` → `english` because that is how the copy file names its
keys.

## Styling notes

The legacy's two-level slide was a transformed track inside an overflow box; only one level
exists at a time here, so there is nothing to slide.

**The two triggers are two different legacy components, not one with
variants.** The share trigger is a filled pill — solid turquoise-700, radius
half its height, with a small-caps label uppercased in CSS (the copy deck
carries it in sentence case). The menu trigger is a glass circle, in the same
frozen glass as the toolbar and **not** a rounded rectangle. Both are 3rem
tall.

Selected and active states are a **ring rather than a fill**, which is how the
legacy marks both of them.

The exploration tiers carry a second line, so their label column stacks where
the other rows do not.
