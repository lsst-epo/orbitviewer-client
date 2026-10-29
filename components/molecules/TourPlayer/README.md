# Tour player

The slide deck over the scene. Ported from the legacy Eleventy app.

## The slide index lives in the URL

In the `slide` search param rather than in component state, so a slide is
linkable and the browser's Back button steps back through the tour.

The legacy kept the index in a field, so **Back from slide twelve of twelve
left the tour altogether** — twelve slides of reading gone in one keystroke.
The param is pushed rather than replaced, so each slide is its own history
entry.

Slide one is the bare path: a tour's canonical URL should not carry a param
that only says "at the beginning".

## The scene follows the deck

Each slide with a `closeUp` flies the camera to that object by writing the
explorer's `object` param; slides without one release it, which is what the
legacy's `goToGuidedExperienceMode` did on the way through.

`openObject` writes that param, and the camera and the detail resolution
already key off it — so **a tour needs no scene API of its own**.

## Craft's four block types are each handled

The legacy rendered only the fields that `defaultSlide` carries — `subTitle`,
`slideTitle`, `slideContent` — for every block type. So:

- a **fun-fact** slide, which has no title, came out as a bare paragraph under
  an empty heading;
- a **share** slide, which has none of those three fields at all, rendered
  completely blank, losing its title, its body and all four of its links.

`Slide` handles each type instead.

Two details within it:

- Craft stores slide body text as **plain text with newlines**, so paragraphs
  are split out rather than collapsed into one block by HTML whitespace
  handling.
- Share-slide links are Craft-authored and outbound, so they open in a new tab
  with the opener severed.

## Layout

The legacy's slide is a left-anchored column inset clear of the header, with the
card pinned to its **bottom** (`justify-content: flex-end`) and sized by its
own content — which is why the legacy site's panel shrinks on a slide with no
image instead of holding a full-height rail. It shares its geometry, and the
same two constraints, with the object card (see Layer's `dock`).

- The top inset clears the share button and the menu. Without it the card runs
  underneath them and the tour title is unreadable.
- The column is only a positioning frame; the scene stays interactive
  everywhere the card itself is not.
- The primary button is the legacy's primary: a turquoise-600 fill with a
  turquoise-100 label. The pale-mint-on-dark this replaces was that pairing
  inverted — the same inversion the splash button and the cloud-search button
  had.

On a narrow viewport the scene has nowhere to go, so the card sits over the
lower half rather than beside it, and the 620px desktop cap is lifted — it
would otherwise leave the card narrower than the viewport it is meant to span.
