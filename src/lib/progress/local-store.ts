import { safeStorage } from "@/lib/storage";
import { emptySnapshot, parseSnapshot, type ProgressSnapshot } from "./snapshot";

// Guest progress in localStorage, exposed as an external store for useSyncExternalStore.

export const LOCAL_PROGRESS_KEY = "tachawit:progress";

const serverSnapshot = emptySnapshot();
const listeners = new Set<() => void>();
let cache: { raw: string | null; snapshot: ProgressSnapshot } | null = null;

function read(): ProgressSnapshot {
  const raw = safeStorage.get(LOCAL_PROGRESS_KEY);
  if (cache?.raw !== raw) cache = { raw, snapshot: parseSnapshot(raw) };
  return cache.snapshot;
}

function notify() {
  cache = null;
  listeners.forEach((listener) => listener());
}

export const localProgressStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === LOCAL_PROGRESS_KEY) notify();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot: read,
  getServerSnapshot: () => serverSnapshot,
  update(change: (snapshot: ProgressSnapshot) => ProgressSnapshot) {
    safeStorage.set(LOCAL_PROGRESS_KEY, JSON.stringify(change(read())));
    notify();
  },
  clear() {
    safeStorage.remove(LOCAL_PROGRESS_KEY);
    notify();
  },
};
