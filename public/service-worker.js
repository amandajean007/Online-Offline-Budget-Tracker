const STATIC_CACHE = "static-cache-v2";
const RUNTIME_CACHE = `data-cache-v1`;
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/css/styles.css",
  "/dist/bundle.js",
  "/js/index.js",
  "/js/db.js",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/dist/manifest.json"
];

// install
self.addEventListener("install", event => {
  // pre cache all static assets
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log("Your files were pre-cached successfully!");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// activate
self.addEventListener("activate", event => {
  // const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
  // remove old caches
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// fetch
self.addEventListener("fetch", event => {
  // cache successful GET requests to the API
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(cache => {
        return fetch(event.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
              console.log("service worker line 63");
            }
            return response;
          })
          .catch(err => {
            return cache.match(event.request);
          });
      }).catch(err => console.log(err))
    );
  // stop execution of the fetch event callback
    return;
  }

  // if the request is not for the API, serve static assests using "offline-first" approach
  event.respondWith(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.match(event.request).then(response => {
        return response || fetch(event.request)
      });
    })
  );
});