const APP_PREFIX = 'loyal-';
const VERSION = 'v0.1.4'; 
const CACHE_NAME = APP_PREFIX + VERSION;

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './JsBarcode.all.min.js',
  './qrcode.min.js',
  './surreal.min.js',
  './loyal_192.png',
  './loyal_512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old versions of the cache
      caches.keys().then((keys) => Promise.all(
        keys.map((k) => (k.startsWith(APP_PREFIX) && k !== CACHE_NAME) ? caches.delete(k) : null)
      )),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});

self.addEventListener('message', (e) => {
  if (e.data.action === 'getVersion') e.source.postMessage({ version: VERSION });
});