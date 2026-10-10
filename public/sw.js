// Friendwave service worker: makes the installed app load fast and fail gracefully.
//   - App files (/_next/static, content-hashed so they never change): cache first
//   - Pages: always from the network; if there's no connection, the offline page
//   - Everything else (API calls, page data, photos): straight to the network, never
//     cached, so nobody's private data sits in this cache
// Bump VERSION to drop old caches after changing this file.
const VERSION = "v1";
const STATIC_CACHE = `friendwave-static-${VERSION}`;
const SHELL_CACHE = `friendwave-shell-${VERSION}`;
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/pwa-icon/192", "/icon"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith("friendwave-") && !key.endsWith(VERSION)).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // the API and images live elsewhere

  // Page loads: network, falling back to the offline page
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // The offline page's own pieces (icons): from the cache, so they show with no connection
  if (PRECACHE.includes(url.pathname) && url.pathname !== OFFLINE_URL) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
    return;
  }

  // Hashed app files: cache first, filled as they're used
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
  }
  // Anything else: the browser handles it normally
});
