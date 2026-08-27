// Service worker for the UAE Portal PWA.
//
// Scope is intentionally narrow: this is a READ-ONLY offline cache.
//   - Static assets (Next.js build output, icons, fonts) -> cache-first.
//   - Page navigations and other same-origin GET requests -> network-first,
//     falling back to the last cached response when offline.
//   - Anything that is not a GET request (POST/PUT/DELETE - i.e. every
//     Next.js Server Action submission) is never touched here at all: the
//     fetch handler returns before calling event.respondWith, so the browser
//     sends it straight to the network exactly as if there were no service
//     worker. Offline, that request fails naturally instead of being queued.
//   - Cross-origin requests (e.g. Supabase) are left alone for the same
//     reason - we only cache what we're confident is safe to replay.

const CACHE_VERSION = "v1";
const STATIC_CACHE = `uae-portal-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `uae-portal-runtime-${CACHE_VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, RUNTIME_CACHE];

const STATIC_ASSET_PATTERN =
  /\.(?:js|css|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|ico|avif)$/i;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith("uae-portal-") && !CURRENT_CACHES.includes(name))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

function isStaticAsset(url) {
  if (url.pathname.startsWith("/_next/static/")) return true;
  if (url.pathname === "/manifest.webmanifest") return true;
  return STATIC_ASSET_PATTERN.test(url.pathname);
}

// Next.js App Router navigations/data requests append a "_rsc" cache-busting
// query param that can change between builds/sessions. Strip it (and nothing
// else) so an offline lookup for the same page/params still finds the last
// cached response.
function normalizedCacheKey(url) {
  const normalized = new URL(url.toString());
  normalized.searchParams.delete("_rsc");
  return normalized.toString();
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cacheKey = normalizedCacheKey(request.url);

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(cacheKey, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never intercept anything but plain reads. In particular this lets every
  // Server Action (POST) pass straight through, offline-fails-naturally, as
  // required.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Leave cross-origin requests (Supabase, etc.) untouched.
  if (url.origin !== self.location.origin) return;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
