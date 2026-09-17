# Stitchloom

**GitHub project ID:** stitchloom

Stitchloom turns a photo into a cross-stitch pattern directly in the browser. Each grid cell is assigned one quantized color and one symbol, so color boundaries stay crisp instead of bleeding from cell to cell.

## What it does

- accepts PNG, JPG, WEBP and GIF images up to 20 MB;
- keeps the image in the browser and never uploads it to a server;
- gives first-time visitors a four-step onboarding tour and lets them reopen it from the header;
- provides complete Russian, English, Spanish, and German interfaces, localized AI prompts and PDF labels, automatically follows the browser's first supported language, and saves a manual override on the device;
- switches to a VK Mini Apps mode when complete VK launch parameters are present: the interface is fixed to Russian, the language picker is hidden, VK Bridge is initialized, a bottom banner uses resize layout, and the first export in a session may show an interstitial ad when inventory is available;
- lets VK Mini Apps users turn the current pattern into a branded 1080 × 1920 card generated locally and open it in the native VK Story editor;
- supports automatic, light and dark interface themes; the automatic mode follows system changes without a reload;
- offers five pattern widths from 36 to 110 cells;
- derives the height from the original image proportions;
- keeps every embroidery cell strictly square (1:1) in the preview and PNG export;
- zooms the on-screen pattern from 50% to 300% with buttons, keyboard, modified wheel or a mobile pinch gesture, and lets users drag the enlarged canvas without changing export quality;
- reduces the result to a selectable 2–256 color palette (16 by default), with practical presets and an exact numeric control;
- offers adaptive photo colors or a constrained palette made only from the bundled DMC catalog, plus easy, balanced, and detailed stitchability modes that merge tiny color islands;
- scores stitchability and estimates finished dimensions, fabric with margins, thread skeins, and stitching time for Aida 11, 14, 16, or 18;
- includes crop, position, rotation, brightness, contrast, saturation, and softening controls before conversion;
- lets users recolor a cell, flood-fill an area, pick a color from the pattern, and undo or redo manual edits;
- autosaves the latest work in IndexedDB and imports or exports a self-contained `.stitchloom` JSON project file; the PWA registers that extension where file handling is supported;
- applies setting changes automatically after a short debounce and reports the real palette size when duplicate or unused colors collapse;
- creates a ready-to-copy AI prompt, tuned to the selected grid width and color limit, for simplifying a difficult source photo in ChatGPT, Gemini or another image editor before conversion;
- shows a color-and-symbol key with stitch counts;
- exports a print-ready, multi-page PDF with a tiled square grid and full color key;
- exports the current pattern as PNG or a cell-by-cell CSV;
- keeps upload, zoom and export controls comfortable on mobile screens and surfaces a shortcut when the generated result is below the fold.

The adaptive color reduction uses the average color of the image area covered by each cell and a median-cut quantizer. Lower values make the pattern more graphic; higher values preserve more of the original image. Adaptive legends show approximate DMC references; the DMC-only mode constrains the generated palette to the bundled real catalog values.

## Run locally

The project is intentionally dependency-free. Serve the folder with any static file server, for example:

    python3 -m http.server 4173 -d dist

Then open http://localhost:4173.

To preview the VK-specific interface and deterministic Bridge mock locally, open `http://localhost:4173/?vk_test=1`. Add `&vk_mock=ads-unavailable` to verify that unavailable advertising fails open without blocking the editor or exports, or `&vk_mock=story-denied` to exercise a cancelled Story share. The test switch is ignored on non-local hosts.

## Publishing

The main branch is configured to deploy dist/ to GitHub Pages through .github/workflows/deploy-pages.yml. The same static output can be deployed to ChatGPT Sites.

- Live demo on GitHub Pages: https://m0rg0t.github.io/stitchloom/
- Public ChatGPT Site: https://stitchloom.antonlenev.chatgpt.site

## AI-readable documentation

- `llms.txt` gives language models a compact map of the product, source files, algorithms, privacy boundary and non-negotiable constraints.
- `SKILL.md` is a reusable Codex-compatible implementation guide for building or extending a Stitchloom-like browser tool. It explains where neural image simplification helps and why the final stitch grid should remain deterministic.

Both documents are also published alongside the application as `llms.txt` and `SKILL.md`.

## VK catalog release pack

Editable catalog artwork, exact-size screenshots, validated Russian listing copy, moderation notes, splash screens, and the catalog manifest live in `release/catalog/`. The source preflight is expected to remain blocked until the real VK App ID and a screenshot of the current app-specific catalog form are added; do not substitute a placeholder ID.

## Privacy

Image decoding, sampling and palette selection happen in the browser with Canvas APIs. No application backend is required for the core flow.

VK launch parameters are used only to select the client-side presentation mode; they are not treated as proof of identity or authorization. Production access decisions would require server-side signature verification.

The optional AI-preparation prompt is copied locally. Stitchloom does not send the image anywhere; if you attach it to an external AI service, that service's privacy terms apply.

Without an explicit choice, Stitchloom follows the first supported language in the browser's preference order and reacts to the browser's `languagechange` event. Search-friendly language pages live at `/ru/`, `/en/`, `/es/`, and `/de/`; the root remains the automatic-language entry point. A manual language choice and the theme choice are stored locally when `localStorage` is available; otherwise they remain active for the current page view. The onboarding dismissal is also device-local: Stitchloom prefers `localStorage`, then falls back to a first-party functional cookie, `sessionStorage`, and finally the current history entry when browser storage is restricted. Project autosaves use IndexedDB and stay on the device.

## License

MIT
