# Capture

Fulfils screenshot requests for the share dialog, from inside the render loop.

## Why it lives inside the Canvas

`CAPTURE_PRIORITY` is one above the compositor's, so by the time it runs the
frame has been drawn and **the drawing buffer is still valid**. That is the
whole reason this is a scene component rather than something the share dialog
does for itself: outside the loop there is no moment at which the buffer is
guaranteed to hold the finished frame.

## The snapshot is copied into a plain 2D canvas

The WebGL buffer is cleared before the next paint, so a reference to
`gl.domElement` would be blank by the time the dialog rendered it. Copying
costs one draw and makes the result an ordinary image that outlives the frame.

The dialog then draws that canvas rather than exporting a data URL — see
`components/organisms/Share/README.md`.
