# Toast

A transient message. Ported from the legacy Eleventy app, where it was a thin
show/hide wrapper over a static element in the markup.

## It is announced politely, not assertively

These are informational — a date clamped to its range, a filter that matched
nothing — not errors. `aria-live="assertive"` would have a screen reader
interrupt whatever it was reading to deliver one, which is out of proportion to
what they say.
