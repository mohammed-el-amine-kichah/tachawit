"use client";

import { useEffect } from "react";

/** Asks the browser to confirm leaving the page while there are changes that won't save themselves. */
export function useUnsavedGuard(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [active]);
}
