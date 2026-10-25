/* Spectre Scoring service worker: caches the whole app for full offline use. Relative URLs, so it works from any sub-path. */
var CACHE = "spectre-scoring-dbab2b107c0f";
var FILES = ["./", "./index.html", "./manifest.webmanifest", "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512.png"];
self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES.map(function(f){ return new Request(f, { cache: "reload" }); })); }));
  /* no automatic skipWaiting: an installed phone keeps the running version until the user taps "Reload" (keeps a score entry safe) */
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){ return Promise.all(keys.filter(function(k){ return k.indexOf("spectre-scoring-") === 0 && k !== CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("message", function(e){ if(e.data === "skipWaiting") self.skipWaiting(); });
/* cache first (the app never calls the network for data); navigations fall back to the cached index.html */
self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  /* live sync only: the Firebase SDK (versioned, immutable files on gstatic) is cached on first use so the app can start offline with sync on */
  if(url.origin === "https://www.gstatic.com" && url.pathname.indexOf("/firebasejs/") === 0){
    e.respondWith(caches.open("spectre-firebase-sdk").then(function(c){ return c.match(e.request).then(function(hit){ return hit || fetch(e.request).then(function(r){ if(r.ok) c.put(e.request, r.clone()); return r; }); }); }));
    return;
  }
  if(url.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function(hit){
    if(hit) return hit;
    return fetch(e.request).then(function(r){ return r; }).catch(function(){ if(e.request.mode === "navigate") return caches.match("./index.html"); return new Response("", { status: 504 }); });
  }));
});
