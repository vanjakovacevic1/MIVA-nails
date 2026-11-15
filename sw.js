// Omogućava da aplikacija radi i bez interneta.
// Kad promeniš neki fajl, povećaj broj verzije (v1 -> v2) da bi telefon povukao novu verziju.
const VERZIJA = 'miva-v2';
const FAJLOVI = ['./', 'index.html', 'style.css', 'app.js', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERZIJA).then(c => c.addAll(FAJLOVI)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(kljucevi => Promise.all(kljucevi.filter(k => k !== VERZIJA).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Prvo pokušaj sa interneta (da uvek dobiješ najnoviju verziju), a ako nema mreže – iz keša.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(odg => {
        const kopija = odg.clone();
        caches.open(VERZIJA).then(c => c.put(e.request, kopija));
        return odg;
      })
      .catch(() => caches.match(e.request))
  );
});
