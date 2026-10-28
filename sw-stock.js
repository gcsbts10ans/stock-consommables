/* Service worker — Stock petits consommables (GCS BTS)
   CACHE doit rester aligné sur APP_VERSION dans index.html. */
var CACHE = "stock-conso-v5";
var FICHIERS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FICHIERS); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (cles) {
      return Promise.all(cles.filter(function (k) { return k !== CACHE; })
                             .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Réseau d'abord (pour avoir toujours la dernière version), cache en secours hors ligne.
   Les appels Firebase/Google ne passent pas par le cache. */
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.hostname.indexOf("googleapis.com") >= 0 && url.hostname.indexOf("fonts") < 0) return;
  if (url.hostname.indexOf("firebase") >= 0) return;
  e.respondWith(
    fetch(req).then(function (rep) {
      if (rep && rep.status === 200 && (url.origin === location.origin || url.hostname.indexOf("fonts.g") === 0)) {
        var copie = rep.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copie); });
      }
      return rep;
    }).catch(function () {
      return caches.match(req).then(function (r) { return r || caches.match("./index.html"); });
    })
  );
});
