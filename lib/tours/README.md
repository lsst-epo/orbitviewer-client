# Tours

Tour shapes and the small amount of logic the templates share.

Craft models a tour's deck as a **matrix of four block types**, and narrowing
is on `__typename`: the blocks share almost no fields, and the fun-fact slide
in particular has only `slideContent`. Nothing else identifies which block a
slide is.
