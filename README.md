# Stitchloom

**GitHub project ID:** stitchloom

Stitchloom turns a photo into a cross-stitch pattern directly in the browser. Each grid cell is assigned one quantized color and one symbol, so color boundaries stay crisp instead of bleeding from cell to cell.

## What it does

- accepts PNG, JPG, WEBP and GIF images up to 20 MB;
- keeps the image in the browser and never uploads it to a server;
- gives first-time visitors a four-step onboarding tour and lets them reopen it from the header;
- offers five pattern widths from 36 to 110 cells;
- derives the height from the original image proportions;
- keeps every embroidery cell strictly square (1:1) in the preview and PNG export;
- zooms and scrolls the on-screen pattern from 50% to 300% without changing export quality;
- reduces the result to a selectable 2–256 color palette (16 by default);
- creates a ready-to-copy AI prompt, tuned to the selected grid width and color limit, for simplifying a difficult source photo in ChatGPT, Gemini or another image editor before conversion;
- shows a color-and-symbol key with stitch counts;
- exports a print-ready, multi-page PDF with a tiled square grid and full color key;
- exports the current pattern as PNG or a cell-by-cell CSV;
- keeps upload, zoom and export controls comfortable on mobile screens.

The color reduction uses the average color of the image area covered by each cell and a median-cut quantizer. Lower values make the pattern more graphic; higher values preserve more of the original image. The legend also shows the nearest DMC-inspired reference shade for orientation, not as a guarantee of a physical thread match.

## Run locally

The project is intentionally dependency-free. Serve the folder with any static file server, for example:

    python3 -m http.server 4173 -d dist

Then open http://localhost:4173.

## Publishing

The main branch is configured to deploy dist/ to GitHub Pages through .github/workflows/deploy-pages.yml. The same static output can be deployed to ChatGPT Sites.

- Live demo on GitHub Pages: https://m0rg0t.github.io/stitchloom/
- Public ChatGPT Site: https://stitchloom.antonlenev.chatgpt.site

## Privacy

Image decoding, sampling and palette selection happen in the browser with Canvas APIs. No application backend is required for the core flow.

The optional AI-preparation prompt is copied locally. Stitchloom does not send the image anywhere; if you attach it to an external AI service, that service's privacy terms apply.

The onboarding dismissal is a device-local preference. Stitchloom prefers `localStorage`, then falls back to a first-party functional cookie, `sessionStorage`, and finally the current history entry when browser storage is restricted.

## License

MIT
