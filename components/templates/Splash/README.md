# Splash

The landing page, ported from the legacy Eleventy app. Craft's `landing`
entry supplies the logo,
headline, eyebrow and button label; the discovery figure comes from Hasura.

The legacy drew this over the running viewer, and its start button kicked off
a performance test and the onboarding dialog. **Here it is a page of its own**
that links to `/explorer`, and the explorer decides for itself whether a visit
is a first one. That keeps a static landing page from having to boot a WebGL
context before anyone has asked to see the scene.

It is still an overlay over the live scene, as the legacy's was — not a
document of its own. The scrim is the legacy's: thin enough that the orbits
read through it, dark enough to hold the type.

The legacy also puts the whole navigation on the splash, which is what makes
the wordmark and the share pill continuous from here into the explorer.

## The discovery figure counts up

Ported from the legacy, which tweened a plain object from `total - 2000` to
`total` over three seconds on `expo.inOut` and wrote
`toLocaleString()` into the element on every frame. gsap is not a dependency
here, so the easing is inlined and the loop is rAF.

The 2000 is a **fixed run-up, not a proportion**: the point is a figure that
visibly climbs, not one that starts from zero.

### Why the state is seeded with the real figure

It is seeded with the total, not the run-up, and stepped back to the run-up by
the first animation frame rather than on mount.

**That ordering is the whole trick.** `requestAnimationFrame` does not fire in
a background tab, so an animation that starts by rendering `total - 2000`
leaves anyone who opened the splash in a background tab staring at a
plausible-looking wrong number.

Deriving the start from the first frame means the figure is correct unless the
climb is actually running, with no need to ask the document whether it is
visible — which is worth avoiding, since `document.hidden` can report `true`
in an embedded pane that is painting and servicing rAF perfectly well.

### Announcing it

The live region announces the **settled** figure once, rather than every frame
of the count, which would be unusable read aloud. Hence `aria-label` on the
element and the digits hidden from the accessibility tree.

Anyone who has asked for less motion gets the figure, not the climb.

## The clock runs fast behind it

`LandingClock` renders nothing. It runs the simulation fast while the splash
is up, so the scene behind it is visibly in motion rather than a still —
`goToLandingMode` tweens `CLOCK_SETTINGS.speed` to 100 hours a second over
five seconds on `expo.inOut`, and entering the viewer calls `goLive()`.

The rate is written to the clock **directly and never through the explorer's
params**, so it stays out of the URL; only the time machine's slider belongs
there.

On the way out it restores whatever rate the URL asked for rather than always
going live. On the ordinary path there is none, so the effect is the legacy's
`goLive()`; on a back-and-forward through the splash it leaves a reader's own
choice of rate intact.

It is a separate component because the splash itself is a server component and
cannot hold the effect.

A ramp is motion for its own sake, so anyone who asked for less of it gets the
rate without the acceleration.

## The language switcher is a real link

The legacy called a global `changeLang()` from a `javascript:` href, which is
not a link at all — no middle-click, no new tab, and nothing for a crawler to
follow between the two localisations.

## Styling notes

- The call to action is the legacy's medium primary button, with its 192px
  floor. The pale mint fill this replaces was inverted — the legacy's primary
  is a teal fill with a pale label, not the other way round.
- The footer pair is separated by a hairline, not a gap, as in the legacy —
  inset top and bottom so it
  reads as a divider rather than a full-height rule.
- The legacy's type scale steps at breakpoints rather than interpolating, so
  the headings are `@media` steps and not a `clamp()`. Sizes are its
  `$font-styles` px over 16: body-large 18/24, subtitle-large 24/32, headline
  32/40, hero 48/60 — every one of them `regular`.
