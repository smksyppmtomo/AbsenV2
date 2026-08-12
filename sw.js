// Dedicated Service Worker for True Standalone PWA Installation & Offline Support
const CACHE_NAME = "yppm-presensi-v2";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/config.js",
  "./js/toast.js",
  "./js/api.js",
  "./js/location.js",
  "./js/camera.js",
  "./js/dashboard.js",
  "./js/calendar.js",
  "./js/profile.js",
  "./js/admin.js",
  "./js/pwa.js",
  "./js/main.js",
  "https://iili.io/KjIKMJ9.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("Some PWA assets could not be cached:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
