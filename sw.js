const CACHE = 'oppanel-v3';
const SHELL = ['./', './index.html', './ops-logo.png', './icon-192.png', './icon-512.png', './manifest.webmanifest'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(()=>{})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.map(k => k === CACHE ? null : caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Live-only: never cache auth/database traffic.
  if (/firestore\.googleapis|identitytoolkit|firebaseinstallations|firebaseio|securetoken\.googleapis/.test(url.href)) return;
  const cacheable = url.origin === location.origin
    || /fonts\.googleapis\.com|fonts\.gstatic\.com|www\.gstatic\.com\/firebasejs/.test(url.href);
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && res.ok && cacheable) { const c = await caches.open(CACHE); c.put(req, res.clone()); }
      return res;
    } catch (err) {
      if (req.mode === 'navigate') { const idx = await caches.match('./index.html'); if (idx) return idx; }
      throw err;
    }
  })());
});
