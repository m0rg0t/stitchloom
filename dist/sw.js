const CACHE_NAME = "stitchloom-v23";
const APP_SHELL = [
  "./",
  "./ru/",
  "./en/",
  "./es/",
  "./de/",
  "./styles.css",
  "./app.js",
  "./vk-bridge-service.js",
  "./vendor/vk-bridge.min.js",
  "./pattern-tools.js",
  "./manifest.webmanifest",
  "./manifest.en.webmanifest",
  "./manifest.es.webmanifest",
  "./manifest.de.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate") return caches.match("./");
        return Response.error();
      }),
  );
});
