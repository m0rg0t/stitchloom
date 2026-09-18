# Flat mascot alternative

This directory contains an alternative, vector-native Stitchloom identity. It
does not replace the active catalog package.

## Visual constraints

- no textures, blur, glow, soft shadows, or SVG gradients;
- six to eight principal colours;
- each object uses one base colour and at most two hard-edged colour regions;
- broad shapes and large cross-stitches remain readable at 64–96 px;
- the square icon canvas is opaque and has no baked outer corner radius.

`mascot-flat.svg` is the reusable transparent character master.
`icon-flat-master.svg` is the square icon master. Every PNG icon is rendered
from it rather than redrawn. The snippet uses the included real current
application capture at `content/snippet-result-crop.png`, copied from
`release/catalog/sources/snippet-result-crop.png`.

`icon-animation-flat.json` is the 96×96, three-second Lottie launch animation.
The needle swings, the character blinks, and the cross-stitches pulse; every
animated property returns to its frame-zero value for a seamless loop.
Regenerate it with `node build-lottie.mjs`.

The image-generation concept and exact prompt are retained as design evidence,
but the shipping alternative is the deterministic SVG, not the generated
raster.
