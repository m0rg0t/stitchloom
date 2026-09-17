---
name: stitchloom
description: Build or extend a privacy-first browser application that turns photographs or AI-simplified images into printable cross-stitch patterns. Use for Stitchloom or similar tools that need square cells, controlled palettes, symbols, zoom, and exports; do not use for manually drawing a single pattern.
---

# Build a Browser Cross-Stitch Generator

Create a usable pattern-making tool, not a mockup. Keep the final photo-to-grid conversion deterministic and local. An image model may simplify the source artwork, but it must not replace the exact grid, palette, legend, and export pipeline.

## Preserve the product contract

- Let the user choose a target width and derive the height from the source aspect ratio.
- Keep every logical and rendered cell strictly square.
- Give every cell exactly one palette index and one symbol.
- Support a palette limit of 2–256 colors and use 16 as the default.
- Keep the core workflow in the browser without uploading the source image.
- Keep Russian and English interfaces behaviorally equivalent, including generated prompts, status text, thread names, exports, metadata, PWA installation, and error pages.
- Use the browser's ordered language preferences only when there is no explicit URL or saved manual override, and react to `languagechange` while that automatic mode is active.
- Make external AI preprocessing optional and clearly identify its separate privacy boundary.
- Treat thread-catalog matches as approximate unless a calibrated conversion and authoritative catalog justify a stronger claim.

When extending an existing application, preserve its visual language, controls, publishing setup, and working exports unless the request explicitly changes them.

## Build the deterministic image pipeline

1. Validate the file type and size before decoding. Use a temporary object URL or `createImageBitmap`, release temporary resources, and show a useful error for unreadable images.
2. Read the selected column count as `gridWidth`. Derive rows with the source proportions:

   ```text
   gridHeight = round(gridWidth * sourceHeight / sourceWidth)
   ```

   Clamp only to documented safety bounds. Do not force the photograph into a square grid.
3. Downsample into logical cells before palette reduction. Average a small source region for each cell instead of reading a single fragile pixel. Keep alpha handling explicit by compositing onto a known background.
4. Quantize the cell averages, not the full-resolution source pixels. Median cut is a good dependency-free default; weighted k-means is reasonable when iteration cost and deterministic seeding are controlled.
5. Map each cell average to exactly one nearest palette entry. Do not dither, blur, interpolate, or blend between final cells.
6. Count palette usage, sort colors by stitch count when helpful, remap every cell after sorting, and assign stable printable symbols. The legend and grid must share the same remapped indices.

If the image contains fewer unique cell colors than requested, return the smaller real palette. Never invent duplicate colors just to reach the requested limit.

## Use a neural model only where it helps

Offer AI simplification as an optional preparation step for noisy photographs, fur, foliage, gradients, cluttered backgrounds, or tiny facial details. Build the prompt from the current grid width and color limit. Ask the image model to:

- preserve the subject, silhouette, pose, composition, and defining features;
- merge small texture into large, readable color regions;
- use no more than the requested number of solid colors;
- produce square pixels with hard edges and no gradients, transparency, antialiasing, or dithering;
- omit grids, symbols, text, fabric, crosses, borders, and invented details;
- return a PNG at the target width with proportional height, or a nearest-neighbor integer enlargement of it.

Treat the generated image as a new source image and run it through the same deterministic sampling and quantization pipeline. Do not trust an image model to supply the final stitch counts, coordinates, DMC labels, or printable grid.

If a later request adds direct model integration, keep API secrets off the client, require an explicit upload action, explain that the photo leaves the device, and retain the local non-AI path. Do not silently change a privacy-first application into a network service.

## Render without distorting cells

- Use one `cellSize` value for both axes.
- Set canvas dimensions to `columns * cellSize` by `rows * cellSize`.
- Account for `devicePixelRatio` without changing the logical geometry.
- Disable image smoothing when scaling pixel artwork.
- Draw grid lines on cell boundaries and choose symbol colors with sufficient contrast.
- Implement preview zoom by changing presentation scale or logical render size. Zoom must not mutate pattern data or export quality.
- Keep the pattern viewport scrollable at high zoom and usable with touch, buttons, keyboard, and modified mouse wheel input.

## Produce useful exports

- PNG: render from pattern data at a fixed export cell size, independent of preview zoom.
- CSV: include row, column, internal color code, symbol, hex color, and any approximate thread reference.
- PDF: tile large patterns across pages, repeat coordinates and overlap cues where needed, and include a complete legend and stitch counts.

Generate all exports from the same immutable pattern object so preview and downloaded files cannot disagree. Revoke temporary download URLs after use and yield between expensive PDF pages to keep mobile browsers responsive.

## Design for mobile and accessibility

- Keep upload, palette, zoom, and download controls reachable at 320 px width.
- Avoid unintended page-level horizontal scrolling; confine large-pattern scrolling to its viewport.
- Use native buttons, labels, status regions, focus states, and a keyboard-operable upload target.
- Keep regular interface text readable and support 200% text enlargement.
- Explain empty, processing, success, and failure states without relying on color alone.

## Apply this repository's architecture

For Stitchloom itself:

- edit product markup and metadata in `dist/index.html`;
- edit responsive styling in `dist/styles.css`;
- edit sampling, quantization, rendering, onboarding, prompting, and exports in `dist/app.js`;
- keep `.openai/hosting.json` pointed at the static `dist` directory;
- preserve GitHub Pages deployment from `dist`.

The project is intentionally dependency-free. Add a dependency only when it materially improves a requested capability and cannot be implemented safely with browser APIs already in use.

## Validate the result

Before publishing, verify observable behavior rather than only checking strings:

- process representative landscape, portrait, transparent, and low-resolution images;
- test 2, 16, and 256 colors and both extreme grid widths;
- confirm preview, PNG, and PDF cells remain square;
- confirm palette counts, cell indices, symbols, and legend entries agree;
- exercise zoom limits and reset without changing exports;
- open every export and inspect at least one tiled PDF boundary;
- test keyboard operation and a 320 px mobile viewport without page overflow;
- switch between Russian and English before and after pattern generation, reload the saved choice, and inspect localized metadata, AI prompts, DMC names, PWA manifests, PDFs, and the 404 page;
- verify browser-language priority order, live `languagechange`, and that explicit URL and stored choices are not overwritten by automatic detection;
- confirm the network panel shows no image upload during the local path;
- run JavaScript syntax and static-asset checks before committing.

Keep changes scoped to the user's request, commit the exact validated source, and publish only through the project's configured hosting flows.
