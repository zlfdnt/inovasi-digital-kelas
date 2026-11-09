// Service worker ringan: gambar = cache lalu segarkan di latar; halaman/JS/CSS = jaringan dulu (selalu versi terbaru), cache bila luring.
const V = 'bk-v4';
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(['./', 'index.html', 'img/favicon.svg']).catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== V).map(n => caches.delete(n)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  const put = res => { if (res && res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; };
  if (/\/img\//.test(u.pathname)) { e.respondWith(caches.match(r).then(h => { const n = fetch(r).then(put).catch(() => h); return h || n; })); return; }
  e.respondWith(fetch(r).then(put).catch(() => caches.match(r, { ignoreSearch: true }).then(h => h || caches.match('index.html'))));
});
