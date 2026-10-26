# Tour card

A tour in the index grid: preview image, a difficulty and duration chip pair,
the title, and a ribbon on featured tours. Ported from the legacy Eleventy
app.

## The whole card is one link

As in the legacy. That is the right shape here — there is nothing else inside
it to interact with — but it does mean **the accessible name has to carry the
chips too**: a screen reader reading the link would otherwise announce the
title alone and lose the duration and difficulty a sighted reader can see.

The chips are therefore marked decorative, since the link's own label already
carries both.

## Type scale

The title is `subtitle-small-regular` stepping to `subtitle-large-regular` at
the legacy's `large` breakpoint — not `medium`, which is where the other pages
step.
