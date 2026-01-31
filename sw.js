const APP_PREFIX = 'loyal-'; // Unique to this app
const VERSION = 'v0.1.2';
const CACHE_NAME = APP_PREFIX + VERSION;

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './JsBarcode.all.min.js',
  './surreal.min.js',
  './loyal_192.png',
  './loyal_512.png'
];

// Install: Save assets to cache and activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

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

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache.startsWith(APP_PREFIX) && cache !== CACHE_NAME) {
            console.log('Cleaning up old Loyal cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data.action === 'getVersion') {
    event.source.postMessage({
      version: VERSION
    });
  }
});