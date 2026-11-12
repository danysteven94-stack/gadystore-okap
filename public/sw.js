/* Service worker Platfomnou — kenbe kokiy app la (paj + fichye estatik) pou li louvri offline.
   Done yo (API) jere pa kouch IndexedDB nan app la, pa isit la. */
const V = "platfomnou-v1";
const STATIC = V + "-static";
const PAGES = V + "-pages";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(PAGES)
      .then((c) => c.addAll(["/offline.html", "/icons/icon-192.png", "/logo.png"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(V)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const STATIC_RE = /^\/(_next\/static\/|icons\/|logo\.png|api\/img\/)/;

async function cacheFirst(req) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function networkFirstPage(req, url) {
  const cache = await caches.open(PAGES);
  const key = url.pathname;
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 6000)),
    ]);
    // Pa kenbe redireksyon (ex: sesyon ekspire → /login) anba kle paj la
    if (res.ok && !res.redirected) cache.put(key, res.clone());
    return res;
  } catch {
    const hit = await cache.match(key);
    if (hit) return hit;
    if (key === "/") {
      const home = (await cache.match("/dashboard")) || (await cache.match("/login"));
      if (home) return home;
    }
    return (await cache.match("/offline.html")) || Response.error();
  }
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname === "/sw.js") return;
  // RSC (navigasyon entèn Next): si li echwe, Next fè yon chajman konplè → ki pase nan kach paj la
  if (req.headers.get("RSC") || url.searchParams.has("_rsc")) return;
  if (url.pathname.startsWith("/api/") && !url.pathname.startsWith("/api/img/")) return;

  if (STATIC_RE.test(url.pathname)) {
    e.respondWith(cacheFirst(req).catch(() => Response.error()));
  } else if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    e.respondWith(networkFirstPage(req, url));
  }
});
