# Performance modal

Offers to drop to the smallest tier when the scene is struggling. Ported from
the legacy Eleventy app.

**It is not a modal in the blocking sense.** It interrupts nothing, so it does
not trap focus and does not cover the scene — the reader can carry on looking
at the thing the offer is about.

## Shown once per session at most

Someone who has declined has said the frame rate is acceptable to them, and
asking again is nagging. The legacy had no such guard.

## The legacy identified its own buttons by CSS class

`secondary` dismissed and `primary` switched, so restyling either one changed
what it did. Here the handlers are props.

The primary action is the legacy's primary button: a turquoise-600 fill with a
turquoise-100 label — the same inversion the splash and tour-player buttons
had.
