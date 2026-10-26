# Rich text

Craft CKEditor output, rendered with `dangerouslySetInnerHTML`.

## It is the trust boundary, and that is the point of the file

The CMS is the only source of this HTML, so it is trusted — the same
assumption the legacy made with `| safe` in every template that touched
authored copy. Centralising it here means the boundary is **one file to audit**
rather than a `dangerouslySetInnerHTML` at every call site.

Anything that is not Craft's own CKEditor output does not belong here.

## Typography is scoped here, not global

The legacy set these rules globally, against element selectors (`p`, `ul`,
`h2`, …). Scoping them to this component keeps the reset
in `globals.css` minimal, as the port plan intends, and means authored copy
cannot restyle the chrome around it.

## Empty content renders nothing

Not an empty wrapper, which would still take its margins and leave a gap where
a section was simply left unauthored.
