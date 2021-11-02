const CACHE_NAME = "static-cache-v2";
const RUNTIME_CACHE = `runtime-cache`;
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/css/styles.css",
  "/js/index.js",
  "/js/db.js",
  "/manifest.webmanifest",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css",
];

// install
self.addEventListener("install", function (evt) {
  // pre cache all static assets
  evt.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll("FILES_TO_CACHE"))
      .then(() => self.skipWaiting())
  );
});

// activate
self.addEventListener("activate", function(evt) {
  // remove old caches
  evt.waitUntil(
    caches
      .keys()
      .then(cacheNames =>
        cacheNames.filter(cacheName => !currentCaches.includes(cacheName))
      )
      .then(cachesToDelete =>
        Promise.all(
          cachesToDelete.map(cacheToDelete => caches.delete(cacheToDelete))
        )
      )
      .then(() => self.clients.claim())
  );
});

// fetch
self.addEventListener("fetch", function(evt) {
  // cache successful GET requests to the API
  if (evt.request.url.includes("/api/transaction")) {
    evt.respondWith(
      caches.open(RUNTIME_CACHE).then(cache =>
        fetch(evt.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
              cache.put(evt.request, response.clone());
              return response;
          })
          .catch(() => caches.match(evt.request))
      )
    );
  // stop execution of the fetch event callback
    return;
  }

  // if the request is not for the API, serve static assests using "offline-first" approach
  evt.respondWith(
    caches.match(evt.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return caches
        .open(RUNTIME_CACHE)
        .then(cache =>
          fetch(evt.request).then(response =>
            cache.put(evt.request, response.clone()).then(() => response)
          )
        );
    })
  );
});