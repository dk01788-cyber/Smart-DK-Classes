const CACHE="smart-dk-public-v5.3";
const CORE=["/","/index.html","/videos.html","/vacancies.html","/guides.html","/about.html","/contact.html","/privacy-policy.html","/terms.html","/legal.html","/assets/css/styles.css","/assets/js/config.js","/assets/js/sdk.js","/assets/js/layout.js","/assets/js/home.js","/assets/js/pdf-viewer.js","/pdf-viewer.html","/assets/img/logo.png","/assets/img/teacher.png","/assets/img/banner.png"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  event.respondWith(fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{});return res;}).catch(()=>caches.match(event.request).then(r=>r||caches.match("/offline.html"))));
});
