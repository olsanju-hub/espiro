// sw.js
// Service Worker "anti-app-vieja": versionado + network-first para HTML/JS/CSS/JSON
const SW_VERSION = 'v2-2026-02-17-01';              // <-- CAMBIA ESTO en cada despliegue
const CACHE_PREFIX = 'espiro-cache-';
const CACHE_NAME = `${CACHE_PREFIX}${SW_VERSION}`;

const CORE = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './discourse.json',
  './css/styles.css',

  './js/app.js',
  './js/router.js',
  './js/routerViews.js',
  './js/drawer.js',
  './js/bibliografia.js',
  './js/gallery.js',
  './js/tecnica.js',
  './js/algoritmo.js',
  './js/simulador.js',
  './js/evaluacion.js',
  './js/presentacion.js',
  './js/discurso.js',
  './js/pwa.js',
  './js/utils.js',

  './assets/algoritmo/algoritmo.png',
  './assets/images/pulmon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-1024.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();

  // Forzar descarga "real" (evita cache HTTP intermedio en algunos entornos)
  const requests = CORE.map((url) => new Request(url, { cache: 'reload' }));

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(requests))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => {
        if (k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME) return caches.delete(k);
        return Promise.resolve();
      })
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const dest = req.destination; // 'document' | 'script' | 'style' | 'image' | ...
  const accept = req.headers.get('accept') || '';
  const isHTML = dest === 'document' || accept.includes('text/html');
  const isCritical =
    isHTML ||
    dest === 'script' ||
    dest === 'style' ||
    url.pathname.endsWith('.json');

  // Network-first para evitar “versión vieja”
  if (isCritical) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (_) {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (isHTML) return caches.match('./index.html');
        return new Response('', { status: 504 });
      }
    })());
    return;
  }

  // Cache-first para el resto
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    try {
      const fresh = await fetch(req);
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, fresh.clone());
      return fresh;
    } catch (_) {
      return new Response('', { status: 504 });
    }
  })());
});
