// sw.js
/* Service Worker robusto: NO se rompe si falta un asset del CORE */
const SW_VERSION = 'espiro-v4-2026-02-16';
const CACHE_NAME = `cache-${SW_VERSION}`;

// IMPORTANTE: que los nombres coincidan EXACTO con tu árbol (case-sensitive en GitHub)
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './css/styles.css',

  './js/app.js',
  './js/router.js',
  './js/routerviews.js',     // <-- CORREGIDO (en tu carpeta está en minúsculas)
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
  './assets/icons/icon-1024.png',

  './discourse.json'
];

// Cache de slides/tech bajo demanda (no en CORE)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // En vez de addAll (que falla si 1 falta), hacemos fetch uno a uno y toleramos errores
    const results = await Promise.allSettled(
      CORE.map(async (path) => {
        const req = new Request(path, { cache: 'reload' });
        const res = await fetch(req);
        if (!res.ok) throw new Error(`CORE fail ${path}: ${res.status}`);
        await cache.put(req, res);
      })
    );

    // Si quieres, puedes loguear fallos (no rompe instalación)
    // results.filter(r => r.status === 'rejected').forEach(r => console.warn(r.reason));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map(k => (k.startsWith('cache-') && k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve())
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

  event.respondWith((async () => {
    const url = new URL(req.url);
    const accept = req.headers.get('accept') || '';
    const isHTML = accept.includes('text/html') || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');

    // 1) HTML: Network-first (evita “app vieja”)
    if (isHTML) {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (_) {
        const cached = await caches.match(req);
        return cached || caches.match('./index.html');
      }
    }

    // 2) Resto: Cache-first + relleno
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