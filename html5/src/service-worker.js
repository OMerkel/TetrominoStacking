/**
 * Service Worker for Tetromino Stacking
 *
 * Implements offline-first caching strategy:
 * - Static assets (CSS, images, icons): cache-first (fast, stale OK)
 * - JavaScript modules: network-first (want latest, fallback to cache)
 * - HTML: network-first (want latest UI, fallback to cache)
 *
 * Cache versions:
 * - CACHE_STATIC: Long-lived for rarely-changing assets (icons, css)
 * - CACHE_DYNAMIC: Dynamic assets (html, js) with 24-hour expiry
 */

const CACHE_STATIC = "tetromino-static-v1";
const CACHE_DYNAMIC = "tetromino-dynamic-v1";
const CACHE_TIMEOUT = 3000; // network timeout in ms

const STATIC_ASSETS = [
  "/TetrominoStacking/html5/src/",
  "/TetrominoStacking/html5/src/index.html",
  "/TetrominoStacking/html5/src/manifest.json",
  "/TetrominoStacking/html5/src/css/index.css",
  "/TetrominoStacking/html5/src/img/icons/favicon.ico",
  "/TetrominoStacking/html5/src/img/icons/tetromino64.png",
  "/TetrominoStacking/html5/src/img/icons/tetromino128.png",
];

/**
 * Install: Pre-cache static assets for offline availability
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  // Skip waiting; activate immediately on update
  self.skipWaiting();
});

/**
 * Activate: Clean up old cache versions
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_STATIC && cacheName !== CACHE_DYNAMIC) {
            return caches.delete(cacheName);
          }
          return null;
        }),
      );
    }),
  );
  // Claim all clients immediately (don't wait for reload)
  self.clients.claim();
});

/**
 * Fetch: Implement cache-first / network-first strategies
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external URLs
  if (
    request.method !== "GET" ||
    !url.pathname.includes("/TetrominoStacking/")
  ) {
    return;
  }

  // Determine cache strategy based on asset type
  if (isStaticAsset(request.url)) {
    // Static assets: cache-first
    event.respondWith(cacheFirstStrategy(request));
  } else {
    // Dynamic assets (HTML, JS): network-first
    event.respondWith(networkFirstStrategy(request));
  }
});

/**
 * Cache-first strategy: Try cache first, fall back to network
 * Used for: CSS, images, icons (rarely change, fast is priority)
 */
function cacheFirstStrategy(request) {
  return caches.match(request).then((cachedResponse) => {
    if (cachedResponse) {
      return cachedResponse;
    }

    return fetchWithTimeout(request, CACHE_TIMEOUT)
      .then((networkResponse) => {
        // Don't cache non-successful responses
        if (networkResponse?.status !== 200) {
          return networkResponse;
        }

        // Clone and cache successful responses
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_STATIC).then((cache) => {
          cache.put(request, responseToCache);
        });

        return networkResponse;
      })
      .catch(() => {
        // Network failed; try cache as fallback
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline placeholder for images
          if (request.destination === "image") {
            return createOfflineImage();
          }
          return createOfflineResponse();
        });
      });
  });
}

/**
 * Network-first strategy: Try network first, fall back to cache
 * Used for: HTML, JavaScript (want latest, but fallback for offline)
 */
function networkFirstStrategy(request) {
  return fetchWithTimeout(request, CACHE_TIMEOUT)
    .then((networkResponse) => {
      // Don't cache non-successful responses
      if (networkResponse?.status !== 200) {
        return networkResponse;
      }

      // Clone and cache successful responses
      const responseToCache = networkResponse.clone();
      caches.open(CACHE_DYNAMIC).then((cache) => {
        cache.put(request, responseToCache);
      });

      return networkResponse;
    })
    .catch(() => {
      // Network failed; try cache
      return caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fallback responses
        if (request.destination === "document") {
          return createOfflineResponse();
        }
        if (request.destination === "image") {
          return createOfflineImage();
        }
        return new Response("Offline - Resource not available", {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "text/plain" },
        });
      });
    });
}

/**
 * Fetch with timeout
 */
function fetchWithTimeout(request, timeout) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Network timeout")), timeout),
    ),
  ]);
}

/**
 * Determine if URL is a static asset (cache-first eligible)
 */
function isStaticAsset(url) {
  return /\.(css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i.test(url);
}

/**
 * Fallback response for offline HTML
 */
function createOfflineResponse() {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tetromino Stacking – Offline</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 600px;
      margin: 2rem auto;
      padding: 1rem;
      background: #1a1a1a;
      color: #e0e0e0;
      text-align: center;
    }
    h1 { color: #4db8ff; }
    p { line-height: 1.6; }
    .note { background: #2a2a2a; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
  </style>
</head>
<body>
  <h1>⚠️ You're Offline</h1>
  <p>The app is currently unavailable because you're not connected to the internet.</p>
  <div class="note">
    <strong>Good news:</strong> If you played before, you can still access cached content by navigating to:
    <br /><a href="/TetrominoStacking/html5/src/index.html" style="color: #4db8ff;">Tetromino Stacking</a>
  </div>
  <p>Your high scores and game progress are saved locally on this device.</p>
</body>
</html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

/**
 * Fallback image for offline
 */
function createOfflineImage() {
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect fill="#333" width="64" height="64"/>
  <text x="32" y="32" text-anchor="middle" dy=".3em" fill="#666" font-family="system-ui" font-size="24">⚠</text>
</svg>`,
    {
      status: 200,
      headers: { "Content-Type": "image/svg+xml" },
    },
  );
}
