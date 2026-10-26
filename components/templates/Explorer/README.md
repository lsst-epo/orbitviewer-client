# Explorer

The explorer's chrome: the toolbar, the panels, the object detail dock, the
time machine and the first-run flow, composed over the shared scene.

The scene itself lives in `components/scene`, and the canvas is mounted above
this template by `components/templates/Viewer` — see those READMEs. This
template is mounted once, by the `(explorer)` route group's layout, and
shared with the tour route; see `app/README.md`.

## Panels

Which one is open lives in the `panel` search param, so the state survives a
reload and is shareable — the same contract the object detail uses.

**Object detail is driven by the `object` param instead**, so an object stays
selected, and framed by the camera, while filters or search is open. Outside
clicks do not dismiss it: a click in the scene is how you pick a different
object, and the legacy's global document handler would have closed the card on
the way. It carries its own labelled Back control and is already inset clear
of the navigation, so a second dismissal in the header would be redundant.

Search applies the same filters the scene does, so it cannot surface an object
that is hidden in the view.

The panels differ in shape, as they do in the legacy:

- **Objects** is a full-viewport takeover, not a drawer — the scene dims
  behind it and the cards run the width of the screen. The toolbar stands
  down rather than layering a close button over a rail the panel is already
  covering, so the way back lives inside the panel (see `molecules/Objects`).
- **Filters** is a small floating card near the top left, not a full-height
  drawer. It and search sit beside the toolbar and keep the header's close.

## A tour replaces the chrome

A tour arrives as this template's **children**, filled by the route under the
`(explorer)` group — see `app/README.md`. A tour drives the scene itself —
which object is framed, where the clock is — so the toolbar, panels and time
machine would be competing with it for the same state. The legacy closed them
all on entering guided mode; here they are simply not rendered.

**Which mode to draw is read from the path, not from `children`.** A layout
always receives the page element, so `children` is truthy on `/explorer` too
even though that page renders nothing. `Viewer` makes the same kind of check
for the splash. The alternative — having the tour announce itself from an
effect — would paint the chrome for one frame before hiding it.

**Recentre and zoom sit outside that switch.** They are how a reader looks
around whatever a tour slide has framed, so they belong in both modes.

`Chrome` — the navigation and the share dialog — is also present during a
tour: a reader still needs a way out and a language switch. The two are one
component because the menu owns the share trigger and both need the data
contexts (quality from `SolarData`, params and clock for the link). The
exploration-mode item is not offered during a tour, since swapping datasets
mid-tour would reload the scene under the slide.

The wordmark is positioned by the chrome, which the legacy puts on its own in
the opposite corner from the navigation — a link at a 1rem inset with 0.75rem
of padding around a 4.5rem mark. On the explorer the toolbar rail
tucks in directly beneath it, which is what makes the two read as one panel.

## First run

Onboarding on a first visit, and the performance nudge afterwards. **The two
are exclusive**: someone still choosing a tier does not need to be told the
one they have not chosen yet is slow. The nudge comes after onboarding rather
than alongside it — two overlays explaining the same screen at once is one too
many.

Onboarding is first-run only and never over a tour: arriving mid-tour is
arriving with a purpose already chosen.

Nothing is shown while the dataset is still coming down. `DatasetLoader` is
over the whole scene saying exactly that, and the two lines were the same
sentence twice.

## The corner spinner outlasts the loader

The small spinner above the object count runs for the download **and for the
particles' arrival fade after it** (`FADE_IN_SECONDS`). The full-screen loader
goes the moment the data lands, but the field is still filling in from the
camera outwards for another five seconds, and a scene that looks empty with
nothing saying why reads as broken. It is tied to that constant rather than
its own timer so the two cannot drift apart.
