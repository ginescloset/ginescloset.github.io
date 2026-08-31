/* GinesCloset - service worker mínimo (network-first para contenido propio) */
const CACHE = "gc-shell-v1";
const SHELL = [
  "./",
  "./index.html",
  "./catalogo.html",
  "./novedades.html",
  "./stock.html",
  "./favoritos.html",
  "./futbol.html",
  "./carrito.html",
  "./cuenta.html",
  "./articulo.html",
  "./styles.css",
  "./app.js",
  "./icons.svg",
  "./manifest.json",
  "./ginescloset-logo.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  // Solo gestionamos peticiones GET del propio dominio. Firebase, Supabase y Google Fonts pasan directas.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.status === 200 && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match("./index.html")))
  );
});
