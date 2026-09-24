type WorkerMessage = { type: "keep"; page: string; audio: string[] } | { type: "forget-pages" };

function post(message: WorkerMessage) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready.then((registration) => registration.active?.postMessage(message)).catch(() => undefined);
}

/** Registers the offline service worker (production builds only; it would fight hot reloading). */
export function registerServiceWorker() {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch((error) => {
    console.error("Could not register the service worker", error);
  });
}

/** Keeps the current page, and the given audio, available offline. */
export function keepForOffline(audio: string[] = []) {
  post({ type: "keep", page: window.location.pathname + window.location.search, audio });
}

/** Drops kept pages, which show the signed-in account (used when signing out). */
export function forgetKeptPages() {
  post({ type: "forget-pages" });
}
