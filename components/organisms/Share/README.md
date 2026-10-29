# Share

A link to the current view, or an image of it. Ported from the legacy Eleventy
app.

## The link carries the simulated date

It is built from the explorer's own params plus the clock's date **at the
moment of sharing**, which is the one piece the URL does not otherwise carry:
the clock only writes `date` when the reader sets one explicitly, so a running
simulation would otherwise share a link back to "now".

The URL is therefore resolved when asked rather than held in state — the clock
moves every frame and the params change under the reader's hands — and
refreshed when the dialog opens, so the field shows what the buttons will
actually send.

## The image is drawn, not exported

The preview is painted into a canvas rather than exported to a data URL: a
1920×1080 PNG string is a few megabytes of JavaScript, and this one only has to
be looked at.

It is captured when the image tab is shown and whenever the shape changes.
Capturing every frame would be pointless work.

## Web Share is checked after mount

`navigator.share` is not knowable on the server, and branching on it during
render would produce different markup on each side — so `NativeShare` resolves
support in an effect.

The legacy rendered that button unconditionally and it **silently rejected**
wherever the API is absent: desktop Firefox, and most of desktop Chrome.

## Dialog behaviour

- Focus moves into the dialog on open. Without it the reader is still on the
  trigger, behind a modal.
- The backdrop closes on click; the dialog itself must not, so the click is
  stopped there.
- Clipboard access can be refused, so the field stays selectable either way
  rather than the copy button being the only route.

## Styling notes

The tab labels are small caps, as the legacy's are.
