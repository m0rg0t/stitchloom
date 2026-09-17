# Stitchloom

**GitHub project ID:** stitchloom

Stitchloom turns a photo into a cross-stitch pattern directly in the browser. Each grid cell is assigned one nearest DMC-inspired color and one symbol, so color boundaries stay crisp instead of bleeding from cell to cell.

## What it does

- accepts PNG, JPG, WEBP and GIF images up to 20 MB;
- keeps the image in the browser and never uploads it to a server;
- offers five pattern widths from 36 to 110 cells;
- derives the height from the original image proportions;
- keeps every embroidery cell strictly square (1:1) in the preview and PNG export;
- reduces the result to a selectable 6–24 color palette;
- shows a color-and-symbol key with stitch counts;
- exports the current pattern as PNG or a cell-by-cell CSV.

## Run locally

The project is intentionally dependency-free. Serve the folder with any static file server, for example:

    python3 -m http.server 4173 -d dist

Then open http://localhost:4173.

## Publishing

The main branch is configured to deploy dist/ to GitHub Pages through .github/workflows/deploy-pages.yml. The same static output can be deployed to ChatGPT Sites.

## Privacy

Image decoding, sampling and palette selection happen in the browser with Canvas APIs. No application backend is required for the core flow.

## License

MIT
