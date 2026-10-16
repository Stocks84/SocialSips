/* Social Sips service worker — minimal, no build plugin needed (works with Next 15).
 * Strategy: network-first for pages (fallback to cached shell), cache-first for icons. */
const CACHE = 'social-sips-v1'
const SHELL = ['/', '/help', '/manifest.json', '/icons/icon-192x192.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  if (req.url.includes('/icons/')) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req)))
    return
  }
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match(req).then((r) => r || caches.match('/'))))
  }
})
