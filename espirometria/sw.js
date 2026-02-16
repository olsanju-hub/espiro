// sw.js
/* Service Worker con versionado para evitar “app vieja” */
const SW_VERSION = 'espiro-v3-2026-02-16';
const CACHE_NAME = `cache-${SW_VERSION}`;

const CORE = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
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

// Cache de slides/tech bajo demanda, no en CORE (pesan)
self.addEventListener('install', (event)=>{
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE))
  );
});

self.addEventListener('activate', (event)=>{
  event.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k.startsWith('cache-') && k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve()));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event)=>{
  if (event.data?.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event)=>{
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith((async ()=>{
    // Network-first para HTML (evita quedarse clavado en portada vieja)
    const url = new URL(req.url);
    const isHTML = req.headers.get('accept')?.includes('text/html');

    if (isHTML){
      try{
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      }catch(_){
        const cached = await caches.match(req);
        return cached || caches.match('./index.html');
      }
    }

    // Cache-first para el resto
    const cached = await caches.match(req);
    if (cached) return cached;

    try{
      const fresh = await fetch(req);
      // Guardar también slides/tech/discourse.json si existen
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, fresh.clone());
      return fresh;
    }catch(_){
      return cached || new Response('', { status: 504 });
    }
  })());
});