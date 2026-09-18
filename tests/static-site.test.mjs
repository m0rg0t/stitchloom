import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const locales = ["ru", "en", "es", "de"];
const publicOrigin = "https://stitchloom.ru";
const index = await readFile(resolve(dist, "index.html"), "utf8");
assert.match(index, new RegExp(`rel="canonical" href="${publicOrigin}/"`));
assert.match(index, new RegExp(`property="og:url" content="${publicOrigin}/"`));
assert.doesNotMatch(index, /stitchloom\.antonlenev\.chatgpt\.site/);
assert.match(index, /id="localePicker"/);
assert.match(index, /class="vk-mode-pill"/);
assert.match(index, /id="shareStory"/);
assert.match(index, /dataset\.vkMode/);
for (const locale of locales) {
  assert.match(index, new RegExp(`data-locale-choice="${locale}"`));
}

const ids = [...index.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(ids.length, new Set(ids).size, "HTML ids must be unique");

for (const locale of locales) {
  const html = await readFile(resolve(dist, locale, "index.html"), "utf8");
  assert.match(html, new RegExp(`<html lang="${locale}"`));
  assert.match(html, new RegExp(`canonical[^>]+${publicOrigin}/${locale}/`));
  assert.doesNotMatch(html, /stitchloom\.antonlenev\.chatgpt\.site/);
  assert.match(html, /<base href="\.\.\/" \/>/);
}

const notFound = await readFile(resolve(dist, "404.html"), "utf8");
assert.match(notFound, /id="localePicker"/);

const privacy = await readFile(resolve(dist, "privacy.html"), "utf8");
assert.match(privacy, /Политика конфиденциальности/);
assert.match(privacy, /github\.com\/m0rg0t\/stitchloom\/issues/);
assert.match(privacy, new RegExp(`rel="canonical" href="${publicOrigin}/privacy\\.html"`));

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
assert.match(sitemap, /\/privacy\.html/);
assert.match(sitemap, new RegExp(`<loc>${publicOrigin}/</loc>`));
assert.doesNotMatch(sitemap, /stitchloom\.antonlenev\.chatgpt\.site/);

const robots = await readFile(resolve(dist, "robots.txt"), "utf8");
assert.match(robots, new RegExp(`Sitemap: ${publicOrigin}/sitemap\\.xml`));

console.log("static-site: ok");
