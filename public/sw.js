/**
 * FUTURA IA — Service Worker
 * Provides basic offline support and asset caching for PWA functionality.
 * Caches static assets on install; serves from cache when network is unavailable.
 */

const CACHE_NAME = 'futura-ia-v1';

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activate immediately without waiting for old SW to die
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ─── Fetch Strategy: Network First, Cache Fallback ───────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept API calls — always hit the network for fresh data
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Never intercept Firebase calls
  if (url.hostname.includes('firebase') || url.hostname.includes('firestore')) {
    return;
  }

  // For navigation requests (HTML), use network-first with HTML cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For static assets: cache-first strategy
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  }
});
