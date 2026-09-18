# VK release artifacts

Target application: [VK App 54777468](https://vk.com/app54777468).

## Ready artifacts

- `stitchloom-vk-build.zip` — current static hosting package. `index.html` is at the archive root; size is about 2.3 MB; no audio or video files are included.
- `stitchloom-vk-catalog-54777468.zip` — portable catalog package with icon, snippet, four screenshots, copy, evidence, editable sources, 1024 px icon, and portrait/landscape splash screens.
- `catalog-package/` — unpacked catalog upload source. Its deterministic catalog preflight passes for app `54777468`.
- `catalog/alternates/flat/` — optional vector-native mascot set with flat icons at 64–1024 px, a 1120×630 catalog snippet, and portrait/landscape splashscreens. It is included as an alternative and does not replace the active 3D identity.

## Deploy tool

The project pins the current official `@vkontakte/vk-miniapps-deploy` version `1.0.2` in `package-lock.json`. `vk-hosting-config.json` points all three VK endpoints to `dist/index.html`, uses app ID `54777468`, and enables non-interactive configuration without storing a token.

No VK hosting upload has been made from this repository yet. Before the first upload, check the app admin for the shared 24-uploads-per-day budget and retained-version limits. Provide `MINI_APPS_ACCESS_TOKEN` only through the local environment or CI secret store, set `MINI_APPS_ENVIRONMENT` explicitly to `dev` or `production`, and preserve the exact uploaded version before confirming production.

## Remaining external gates

- Save a screenshot of the current catalog form for app `54777468` and replace `catalog/ADMIN-REQUIREMENTS-NEEDED.md` as requirements evidence.
- Perform the first VK hosting upload from an authorized administrator session or secret-backed CI job.
- Confirm the exact uploaded production version and verify its URL returns HTTP 200.
- Smoke-test banners, interstitials, Story sharing, safe areas, and downloads in a real mobile VK client.
