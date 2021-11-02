const STATIC_CACHE = "static-cache-v2";
const RUNTIME_CACHE = `runtime-cache`;
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/css/styles.css",
  "/dist/bundle.js",
  "/js/index.js",
  "/js/db.js",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css",
];

// install
self.addEventListener("install", function (event) {
  // pre cache all static assets
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// activate
self.addEventListener("activate", event => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
  // remove old caches
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return cacheNames.filter(
          cacheName => !currentCaches.includes(cacheName)
        );
      })
      .then(cachesToDelete => {
        return Promise.all(
          cachesToDelete.map(cacheToDelete => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// fetch
self.addEventListener("fetch", event => {
  // cache successful GET requests to the API
  if (
    event.request.method !== "GET" ||
    !event.request.url.startsWith(self.location.origin)
    ) {
      event.respondWith(
        caches.open(RUNTIME_CACHE).then(cache => {
          return fetch(event.request)
            .then(response => {
              // If the response was good, clone it and store it in the cache.
                cache.put(event.request, response.clone());
                return response;
            })
            .catch(() => caches.match(event.request))
          })
      );
  // stop execution of the fetch event callback
    return;
  }

  // if the request is not for the API, serve static assests using "offline-first" approach
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return caches
        .open(RUNTIME_CACHE)
        .then(cache => {
          return fetch(event.request).then(response => {
            return cache.put(event.request, response.clone()).then(() => {
              return response
            });
          });
        });
    })
  );
});