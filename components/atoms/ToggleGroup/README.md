# Toggle group

A segmented single-choice control, ported from the legacy Eleventy app.

epo-react-lib has no equivalent: `Select` is a dropdown, which is the wrong
affordance for two or three always-visible options.

## It is a radiogroup, not a row of buttons

So arrow keys move between the options and assistive technology announces the
selection. Only the selected option is tabbable, which is the expected
radiogroup behaviour — a group is one tab stop, not three.

The legacy used plain buttons and conveyed the chosen option through a class
alone, so there was nothing to announce and nothing to arrow between.

## Styling notes

Ported from the legacy:

- A **pill**, not a rounded rectangle: the radius is the full height rather
  than a corner token.
- The large size, which is what the filters panel uses.
- 24px between the label and the control, matching the range slider's field —
  a literal in the legacy rather than a margin token.
- The field name is set at the legacy's large body size. It does not bold
  these.
- The options are small, uppercased, semibold, and **teal even when not
  chosen** — the legacy never greys the alternatives here.
- The chosen option is a turquoise-600 fill with a turquoise-200 label, which
  is the legacy's inversion rather than the pale mint on dark that the port
  had. The legacy slides an indicator pill behind the chosen item; this
  paints the same pill on the item itself, and the slide is not reproduced.
