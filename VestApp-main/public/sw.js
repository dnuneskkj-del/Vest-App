// Basic Service Worker
const CACHE_NAME = 'vestapp-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/Vestapp/img/vest.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
