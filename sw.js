const CACHE_NAME = 'wallet-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './JsBarcode.all.min.js',
  './loyal_192.png',
  './loyal_512.png'
];

// Install: Save assets to cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Fetch: Serve from cache first, then network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});