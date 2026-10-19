// Success IELTS service worker — Fase 15.
//
// Deliberately narrow scope: only the public, non-authenticated shell
// (landing, Info IELTS, Privasi, login/register, offline fallback) and
// Next.js's content-hashed static assets are cached. Every other route —
// dashboard, every Lab, Tryout, admin, all /api/* — is left untouched here
// (network falls through to the browser's normal handling) because that
// data must always be live: Tryout's deadline/grading is server-authoritative
// (see D-038), and a stale cached dashboard or submission screen would be
// actively misleading rather than helpful. This is "installable + an honest
// offline fallback for the marketing/info shell", not full offline-first
// content caching — see D-042.

const CACHE_NAME = "success-ielts-shell-v1";
const PUBLIC_SHELL_PATHS = ["/", "/info-ielts", "/privasi", "/login", "/register", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PUBLIC_SHELL_PATHS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isCacheableStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Content-hashed by Next.js — safe to cache-first forever.
  if (isCacheableStaticAsset(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  const isNavigation = request.mode === "navigate";
  const isPublicShellPath = PUBLIC_SHELL_PATHS.includes(url.pathname);

  // Everything else — dashboard, every Lab, Tryout, admin, all /api/* — is
  // intentionally left alone: no caching, no offline fallback.
  if (!isNavigation || !isPublicShellPath) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        }
        return response;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        return cached ?? cache.match("/offline");
      }),
  );
});
