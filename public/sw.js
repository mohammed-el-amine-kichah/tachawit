// Tachawit service worker: keeps the map, opened lessons and their audio usable offline.
// Build assets are cached on first use; pages go to the network first and fall back to the copy
// kept from the last visit, then to an offline page in the visitor's language.

const VERSION = "v1";
const STATIC_CACHE = `tachawit-static-${VERSION}`;
const PAGES_CACHE = "tachawit-pages";
const AUDIO_CACHE = "tachawit-audio";
const CACHES = [STATIC_CACHE, PAGES_CACHE, AUDIO_CACHE];
const LIMITS = { [STATIC_CACHE]: 400, [PAGES_CACHE]: 80, [AUDIO_CACHE]: 600 };
const PREFIXES = ["ar", "dz", "en", "fr"];
const DEFAULT_PREFIX = "ar";
const OFFLINE_PATHS = PREFIXES.map((prefix) => `/${prefix}/offline`);
const NETWORK_TIMEOUT_MS = 4000;

function localePrefix(pathname) {
  const first = pathname.split("/")[1];
  return PREFIXES.includes(first) ? first : null;
}

/** Pages kept for offline use: the map, levels, review and the offline page itself. */
function isKeptPage(pathname) {
  const prefix = localePrefix(pathname);
  if (!prefix) return false;
  const rest = pathname.slice(prefix.length + 1).replace(/\/+$/, "");
  return rest === "" || rest === "/review" || rest === "/offline" || /^\/level\/[^/]+$/.test(rest);
}

function offlinePathFor(pathname) {
  return `/${localePrefix(pathname) ?? DEFAULT_PREFIX}/offline`;
}

/** Which strategy handles a request, or null to leave it to the network. */
function routeFor(url, request, origin) {
  if (request.method !== "GET") return null;
  if (url.pathname.startsWith("/storage/v1/object/public/audio/")) return "audio";
  if (url.origin !== origin) return null;
  if (request.mode === "navigate") {
    const rest = url.pathname.split("/").slice(2).join("/");
    const privateArea = /^(admin|login)(\/|$)/.test(rest) || url.pathname.startsWith("/api/");
    return privateArea ? null : "page";
  }
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/icon.svg"
  ) {
    return "static";
  }
  return null;
}

/** A single `bytes=` range, clamped to the file; null when absent or unsatisfiable. */
function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header ?? "");
  if (!match || (match[1] === "" && match[2] === "")) return null;
  let start;
  let end;
  if (match[1] === "") {
    start = Math.max(0, size - Number(match[2]));
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
  }
  return start < size && start <= end ? { start, end } : null;
}

const rules = { routeFor, isKeptPage, offlinePathFor, parseRange, OFFLINE_PATHS };

if (typeof ServiceWorkerGlobalScope === "undefined" || !(self instanceof ServiceWorkerGlobalScope)) {
  // Loaded outside a worker (unit tests): expose the rules only.
  globalThis.TachawitServiceWorker = rules;
} else {
  installWorker();
}

function installWorker() {
  async function trim(cacheName) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const excess = keys.length - LIMITS[cacheName];
    // Oldest first; the offline pages are re-added on the next install anyway.
    for (const request of keys.slice(0, Math.max(0, excess))) await cache.delete(request);
  }

  async function put(cacheName, request, response) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
    await trim(cacheName);
  }

  async function keepPage(url) {
    const response = await fetch(url, { credentials: "same-origin", headers: { Accept: "text/html" } });
    if (response.ok && response.type === "basic" && !response.redirected) await put(PAGES_CACHE, url, response);
  }

  async function keepAudio(url) {
    const cache = await caches.open(AUDIO_CACHE);
    if (await cache.match(url)) return;
    const response = await fetch(url, { mode: "cors", credentials: "omit" });
    if (response.ok) await put(AUDIO_CACHE, url, response);
  }

  self.addEventListener("install", (event) => {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(PAGES_CACHE);
        await Promise.all(OFFLINE_PATHS.map((path) => cache.add(path).catch(() => undefined)));
        await self.skipWaiting();
      })(),
    );
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      (async () => {
        for (const name of await caches.keys()) {
          if (name.startsWith("tachawit-") && !CACHES.includes(name)) await caches.delete(name);
        }
        await self.clients.claim();
      })(),
    );
  });

  self.addEventListener("message", (event) => {
    const data = event.data ?? {};
    if (data.type === "keep" && typeof data.page === "string") {
      const page = new URL(data.page, self.location.origin);
      const audio = Array.isArray(data.audio) ? data.audio.filter((url) => typeof url === "string") : [];
      event.waitUntil(
        Promise.all([
          page.origin === self.location.origin && isKeptPage(page.pathname) ? keepPage(page.href) : null,
          ...audio.map((url) => keepAudio(url)),
        ]).catch(() => undefined),
      );
    } else if (data.type === "forget-pages") {
      // After signing out: pages kept for offline use show the account in the header.
      event.waitUntil(
        (async () => {
          await caches.delete(PAGES_CACHE);
          const cache = await caches.open(PAGES_CACHE);
          await Promise.all(OFFLINE_PATHS.map((path) => cache.add(path).catch(() => undefined)));
        })(),
      );
    }
  });

  async function fromStaticCache(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) await put(STATIC_CACHE, request, response.clone());
    return response;
  }

  async function audioResponse(request) {
    const url = request.url;
    const cache = await caches.open(AUDIO_CACHE);
    let full = await cache.match(url);
    if (!full) {
      try {
        const response = await fetch(url, { mode: "cors", credentials: "omit" });
        if (!response.ok) return response;
        await put(AUDIO_CACHE, url, response.clone());
        full = response;
      } catch {
        return fetch(request);
      }
    }
    const range = request.headers.get("range");
    if (!range) return full;
    // Media elements ask for byte ranges; Safari only plays audio answered with 206.
    const body = await full.arrayBuffer();
    const bounds = parseRange(range, body.byteLength);
    if (!bounds) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${body.byteLength}` } });
    }
    return new Response(body.slice(bounds.start, bounds.end + 1), {
      status: 206,
      headers: {
        "Content-Type": full.headers.get("Content-Type") ?? "audio/mpeg",
        "Content-Length": String(bounds.end - bounds.start + 1),
        "Content-Range": `bytes ${bounds.start}-${bounds.end}/${body.byteLength}`,
        "Accept-Ranges": "bytes",
      },
    });
  }

  async function pageResponse(event) {
    const { request } = event;
    const url = new URL(request.url);
    const kept = isKeptPage(url.pathname);
    const network = fetch(request).then((response) => {
      if (kept && response.ok && response.type === "basic" && !response.redirected) {
        event.waitUntil(put(PAGES_CACHE, request.url, response.clone()));
      }
      return response;
    });
    network.catch(() => undefined); // handled below; avoids an unhandled rejection when the timeout wins
    const fallback = async () =>
      (await caches.match(request.url, { cacheName: PAGES_CACHE })) ??
      (await caches.match(request.url, { cacheName: PAGES_CACHE, ignoreSearch: true }));

    try {
      if (!kept) return await network;
      // On a very slow connection, a kept copy beats waiting.
      const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS, "timeout"));
      const first = await Promise.race([network, timeout]);
      if (first !== "timeout") return first;
      return (await fallback()) ?? (await network);
    } catch {
      return (
        (await fallback()) ??
        (await caches.match(offlinePathFor(url.pathname), { cacheName: PAGES_CACHE })) ??
        new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } })
      );
    }
  }

  self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);
    const route = routeFor(url, request, self.location.origin);
    if (route === "static") event.respondWith(fromStaticCache(request));
    else if (route === "audio") event.respondWith(audioResponse(request));
    else if (route === "page") event.respondWith(pageResponse(event));
  });
}
