const CACHE_NAME = "shochu-keep-ledger-v34-1-icons-20261006";
const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css?v=34.0",
  "./supabase-config.js?v=22",
  "./app.js?v=34.0",
  "./manifest.webmanifest?v=22",
  "./icons/favicon-20261006.ico",
  "./icons/icon-32-20261006.png",
  "./icons/icon-192-20261006.png",
  "./icons/icon-512-20261006.png",
  "./icons/maskable-192-20261006.png",
  "./icons/maskable-512-20261006.png",
  "./icons/apple-touch-icon-20261006.png",
  "./vendor/tesseract/tesseract.min.js?v=7.0.0",
  "./vendor/tesseract/worker.min.js",
  "./vendor/tesseract/core/tesseract-core-lstm.wasm.js",
  "./vendor/tesseract/core/tesseract-core-lstm.wasm",
  "./vendor/tesseract/core/tesseract-core-simd-lstm.wasm.js",
  "./vendor/tesseract/core/tesseract-core-simd-lstm.wasm",
  "./vendor/tesseract/core/tesseract-core-relaxedsimd-lstm.wasm.js",
  "./vendor/tesseract/core/tesseract-core-relaxedsimd-lstm.wasm",
  "./vendor/tesseract/lang/jpn.traineddata.gz",
  "./vendor/tesseract/lang/jpn_vert.traineddata.gz"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Keep the installed app's manifest URL stable, but check for icon updates.
  if (new URL(event.request.url).pathname === new URL("./manifest.webmanifest", self.location).pathname) {
    event.respondWith(
      fetch(event.request, { cache: "no-cache" }).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
          return response;
        }
        return caches.match(event.request).then((cached) => cached || response);
      }).catch(() => caches.match(event.request))
    );
    return;
  }
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok && new URL(event.request.url).origin === self.location.origin) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
