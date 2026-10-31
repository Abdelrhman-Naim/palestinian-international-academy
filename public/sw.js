// Service Worker for Palestinian International Academy (PIA) PWA
// Compliant with pwa-offline standards (network-first navigation, versioned caches, skipWaiting on message)

const CACHE_VERSION = 'pia-pwa-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_ASSETS = [
  '/manifest.json',
  '/site.webmanifest',
  '/favicon.ico',
  '/favicon.png?v=3',
  '/icon-192.png?v=3',
  '/icon-512.png?v=3',
  '/logo.webp'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache notice:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // P-506: Never cache non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Skip Supabase auth/API calls and chrome-extensions
  if (url.origin !== self.location.origin) {
    // Cross-origin: allow normal fetch, do not cache unknown statuses (P-507)
    return;
  }

  // P-502: Navigation requests (HTML pages) -> Network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const rootCached = await caches.match('/');
          if (rootCached) return rootCached;
          return new Response(
            `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>غير متصل بالإنترنت | PIA</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100dvh;margin:0;background:#FAF7F2;text-align:center;padding:20px}h1{color:#333;margin-bottom:8px}p{color:#666}button{touch-action:manipulation;}</style></head><body><div><h1>أنت غير متصل بالإنترنت</h1><p>يرجى التحقق من اتصال الشبكة وإعادة المحاولة.</p><button onclick="location.reload()" style="background:#D4AF37;color:#fff;border:none;padding:10px 20px;border-radius:12px;font-weight:bold;cursor:pointer">إعادة المحاولة</button></div></body></html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // Static Assets (_next/static, images, fonts) -> Stale-while-revalidate or Cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2|woff|ttf|css|js)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }
});
