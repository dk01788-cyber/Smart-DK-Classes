const CACHE_NAME = "smart-dk-app-v1";
const STATIC_ASSETS = [
  "/app-login.html?app=1",
  "/app-login.html",
  "/forgot-password.html",
  "/reset-password.html",
  "/dashboard.html",
  "/shop.html",
  "/vacancies.html",
  "/affiliate.html",
  "/videos.html",
  "/test-series.html",
  "/assets/css/styles.css",
  "/assets/js/config.js",
  "/assets/js/sdk.js",
  "/assets/js/layout.js",
  "/assets/js/auth.js",
  "/assets/img/logo.svg",
  "/assets/img/app-icon-192.png",
  "/assets/img/app-icon-512.png",
  "/offline.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.pathname.startsWith("/api/") || url.hostname.includes("supabase") || url.hostname.includes("razorpay")) return;

  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(async () => (await caches.match(req)) || caches.match("/offline.html")));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
      return res;
    }).catch(() => cached)));
  }
});
