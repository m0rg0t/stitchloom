import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const locales = ["ru", "en", "es", "de"];
const index = await readFile(resolve(dist, "index.html"), "utf8");
assert.match(index, /id="localePicker"/);
assert.match(index, /class="vk-mode-pill"/);
assert.match(index, /dataset\.vkMode/);
for (const locale of locales) {
  assert.match(index, new RegExp(`data-locale-choice="${locale}"`));
}

const ids = [...index.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(ids.length, new Set(ids).size, "HTML ids must be unique");

for (const locale of locales) {
  const html = await readFile(resolve(dist, locale, "index.html"), "utf8");
  assert.match(html, new RegExp(`<html lang="${locale}"`));
  assert.match(html, new RegExp(`canonical[^>]+/${locale}/`));
  assert.match(html, /<base href="\.\.\/" \/>/);
}

const notFound = await readFile(resolve(dist, "404.html"), "utf8");
assert.match(notFound, /id="localePicker"/);

for (const filename of [
  "styles.css",
  "app.js",
  "pattern-tools.js",
  "vk-bridge-service.js",
  "vendor/vk-bridge.min.js",
  "sw.js",
  "icon-192.png",
  "icon-512.png",
]) {
  await access(resolve(dist, filename));
}

for (const filename of [
  "manifest.webmanifest",
  "manifest.en.webmanifest",
  "manifest.es.webmanifest",
  "manifest.de.webmanifest",
]) {
  const manifest = JSON.parse(await readFile(resolve(dist, filename), "utf8"));
  assert.equal(manifest.file_handlers[0].accept["application/x-stitchloom+json"][0], ".stitchloom");
  assert.equal(manifest.display, "standalone");
}

const sitemap = await readFile(resolve(dist, "sitemap.xml"), "utf8");
for (const locale of locales) assert.match(sitemap, new RegExp(`/${locale}/`));

console.log("static-site: ok");
